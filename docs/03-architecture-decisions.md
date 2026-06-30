# 🏗️ Architecture Decision Records (ADR)

> **Document ID**: WHISPER-ADR-001  
> **Status**: Living Document · **Owner**: Engineering  
> **Convention**: Each ADR is immutable once accepted. New decisions get new entries.

---

## ADR-001: NestJS as the Application Framework

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: We need a Node.js framework that enforces architectural patterns, scales well, and has strong TypeScript support.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Express.js | Minimal, flexible, huge ecosystem | No structure enforced, easy to build spaghetti |
| Fastify | Fastest Node framework, schema validation | Smaller ecosystem, less opinionated |
| **NestJS** | Enforced modules/DI/decorators, enterprise patterns, built on Express/Fastify | Steeper learning curve, more boilerplate |
| Hono | Ultra-lightweight, edge-ready | Too new, minimal ORM integration |

**Decision**: Use **NestJS 11** on top of Express.

**Rationale**: NestJS enforces separation of concerns (modules, controllers, services) from day one. Its dependency injection system mirrors enterprise frameworks (Spring Boot, ASP.NET). The decorator-based approach maps naturally to TypeScript. The ecosystem (`@nestjs/passport`, `@nestjs/swagger`) reduces integration boilerplate significantly.

**Consequences**: Higher initial learning curve, but cleaner codebase at scale. New engineers must learn NestJS module system before contributing.

---

## ADR-002: TypeScript with Strict Configuration

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: JavaScript's dynamic typing causes runtime errors that are expensive to debug.

**Decision**: Use **TypeScript 5.7+** with strict null checks enabled.

**Key tsconfig.json settings**:
```json
{
  "strictNullChecks": true,
  "emitDecoratorMetadata": true,
  "experimentalDecorators": true,
  "target": "ES2023",
  "module": "nodenext"
}
```

**Rationale**: `strictNullChecks` catches null/undefined errors at compile time. `emitDecoratorMetadata` is required by NestJS DI. ES2023 target enables modern syntax without transpilation overhead.

**Future consideration**: Enable `"strict": true` fully once team is comfortable (adds `noImplicitAny`, `strictBindCallApply`).

---

## ADR-003: PostgreSQL as the Primary Database

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: We need a database for structured blog data with relations (users → posts → comments → tags).

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| **PostgreSQL** | ACID, JSON support, full-text search, mature | Heavier than SQLite for dev |
| MySQL | Widely used, fast reads | Weaker JSON support, licensing concerns |
| MongoDB | Flexible schema, easy start | No relations, eventual consistency risks |
| SQLite | Zero-config, embedded | No concurrent writes, not production-ready |

**Decision**: Use **PostgreSQL 15+** for all environments.

**Rationale**: Blog data is inherently relational (users have posts, posts have comments, posts have tags via M:N). PostgreSQL's UUID support, JSONB columns, and index types (GIN for full-text search) provide a growth path. It's the default database for production Node.js APIs.

---

## ADR-004: Prisma as the Object-Relational Mapper

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: We need an ORM that provides excellent TypeScript support, a clean migration system, and good developer experience for a PostgreSQL-backed API.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| TypeORM | Native NestJS integration, decorator entities | Inconsistent API, bugs in 0.3.x, stale maintenance |
| **Prisma** | Excellent DX, fully type-safe client, schema-first, auto migrations | Different paradigm (no decorators), requires codegen step |
| MikroORM | Unit of work pattern, great TS support | Smaller ecosystem |
| Drizzle | Lightweight, SQL-like syntax | Very new, no NestJS module |
| Raw SQL (pg) | Full control | No migration system, manual mapping |

**Decision**: Use **Prisma 6.x** with `@prisma/client`.

**Rationale**: Prisma's schema-first approach (`prisma/schema.prisma`) provides a single source of truth for the data model. The generated `PrismaClient` is fully type-safe — every query, relation, and filter is checked at compile time. Prisma's migration system (`prisma migrate dev`) is simpler and more reliable than TypeORM's. `prisma studio` provides a built-in database GUI.

**Integration with NestJS**: Prisma is injected as a NestJS provider via a `PrismaService` that extends `PrismaClient` and implements `OnModuleInit` for connection lifecycle management.

**Trade-off acknowledged**: Prisma requires a codegen step (`prisma generate`) after every schema change. This is automated in the dev workflow and Docker build.

---

## ADR-005: JWT-Based Stateless Authentication

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: We need authentication for API consumers (mobile apps, SPAs, other services).

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Session cookies | Simple, server-controlled | Requires session store, not RESTful |
| **JWT (access + refresh)** | Stateless, scalable, mobile-friendly | Can't revoke instantly without token version |
| OAuth2 / OpenID Connect | Enterprise standard | Overkill for a single API, complex setup |

**Decision**: Use **JWT with short-lived access tokens (15 min) and long-lived refresh tokens (7 days)**.

**Token invalidation strategy**: Store `tokenVersion` on the User entity. Increment it on logout or password change. JwtStrategy.validate() rejects tokens with a stale version.

**Refresh token storage**: Hashed with bcrypt and stored on the User entity. On refresh, compare hashes, issue new pair, update stored hash (rotation).

---

## ADR-006: Role-Based Access Control (RBAC) with Guards

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: Different users need different permissions (readers vs authors vs admins).

**Decision**: Implement RBAC using NestJS Guards + custom decorators.

**Implementation pattern**:
1. `@Roles(Role.ADMIN)` decorator — sets metadata on route
2. `RolesGuard` — reads metadata via `Reflector`, compares to `req.user.role`
3. `@Public()` decorator — marks routes that skip JWT verification
4. Guard order: `JwtAuthGuard → RolesGuard → Handler`

**Rationale**: NestJS Guards are the idiomatic way to handle authorization. The `SetMetadata` + `Reflector` pattern is documented in the official NestJS docs and keeps authorization declarative (on the route) rather than imperative (in the service).

**Future consideration**: If permissions become complex (per-resource, per-field), migrate to CASL ability-based authorization.

---

## ADR-007: Validation with class-validator and Global ValidationPipe

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: All incoming data validated via **DTOs decorated with class-validator**, processed by a globally-registered `ValidationPipe`.

**Global pipe configuration**:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,            // strip unknown properties
  forbidNonWhitelisted: true, // reject if unknown properties present
  transform: true,            // auto-transform payloads to DTO instances
  transformOptions: {
    enableImplicitConversion: true,
  },
}));
```

**Rationale**: This configuration ensures: (1) no unknown fields reach handlers, (2) type coercion is automatic (query params `"1"` → `1`), (3) validation errors return structured 400 responses.

---

## ADR-008: Standardized Response Shape via Interceptor

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: All successful responses wrapped by a global `TransformInterceptor`.

**Shape**: `{ data: T, statusCode: number }` for single resources; `{ data: T[], meta: PaginationMeta, statusCode: number }` for lists.

**Rationale**: Frontend consumers can always expect a consistent envelope. Error responses are handled by a global `HttpExceptionFilter` with a different but equally consistent shape.

---

## ADR-009: Redis for Caching with Graceful Degradation

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: Use Redis as the cache store via `@nestjs/cache-manager`. If Redis is unavailable, fall back to in-memory cache.

**Rationale**: Redis survives server restarts and can be shared across instances. Graceful degradation ensures the API works even without Redis (just slower).

---

## ADR-010: pnpm as Package Manager

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: Use **pnpm** instead of npm or yarn.

**Rationale**: pnpm's content-addressable store saves disk space when managing multiple Node.js projects. Its strict `node_modules` structure prevents phantom dependencies. Speed is comparable to yarn.

---

## ADR-011: Soft Deletes for Users and Posts

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: Users and Posts use soft deletes (`deletedAt DateTime?` field) rather than hard deletes.

**Rationale**: Soft deletes allow data recovery, audit trails, and prevent broken foreign key references. Prisma middleware intercepts `delete` operations and converts them to `update` calls that set `deletedAt`. A second middleware on `findMany`/`findFirst` automatically filters out soft-deleted records.

---

## ADR-012: Multi-Stage Docker Build

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: Use a multi-stage Dockerfile:
- **Stage 1** (builder): Install deps, generate Prisma client, compile TypeScript
- **Stage 2** (runner): Copy only `dist/`, generated Prisma client, and production `node_modules`

**Rationale**: Final image is ~150MB instead of ~800MB. No TypeScript compiler, no dev dependencies, no source code in production image.

---

## ADR-013: Docker Compose for Local Infrastructure

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: The project depends on PostgreSQL, Redis, and MinIO. Installing these natively on each developer's machine is error-prone and version-inconsistent.

**Decision**: Run all infrastructure services via **Docker Compose**. The NestJS API itself runs natively with `pnpm run start:dev` for hot-reload.

**Services**:
| Service | Image | Purpose |
|---------|-------|---------|
| postgres | `postgres:15-alpine` | Primary database |
| redis | `redis:7-alpine` | Caching + rate limiting storage |
| minio | `minio/minio:latest` | S3-compatible object storage |
| minio-init | `minio/mc:latest` | One-shot bucket creation |

**Rationale**: Docker Compose ensures every developer has identical infrastructure. `docker compose up -d` is one command to start everything. Volumes persist data across restarts. Health checks ensure services are ready before the API connects.

**Consequences**: Docker Desktop must be installed. Port conflicts are possible if developers run local PostgreSQL/Redis — mitigated by documenting the required ports.

---

## ADR-014: MinIO for Object Storage (S3-Compatible)

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: The Blog API needs file upload support (post thumbnails, user avatars). Storing files on the local filesystem is not scalable and breaks in containerized/multi-instance deployments.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| Local filesystem | Simple, no setup | Not scalable, lost on container restart |
| AWS S3 | Industry standard, scalable | Requires AWS account, costs money |
| Cloudinary | Image-specific features | Vendor lock-in, pricing |
| **MinIO** | S3-compatible, free, self-hosted, Docker-ready | Must self-host in production |

**Decision**: Use **MinIO** in development (Docker), with the option to swap to AWS S3 in production by changing only environment variables.

**Rationale**: MinIO implements the S3 API. We use `@aws-sdk/client-s3` (the official AWS SDK) to interact with it — the same code works against both MinIO and real S3. This gives us free local development with a zero-cost migration path to AWS.

**File key pattern**: `{resource}/{id}/{filename}` (e.g., `posts/abc-123/thumbnail.webp`)

---

## How to Add a New ADR

1. Copy the template below
2. Assign the next sequential number (ADR-0XX)
3. Fill in Context, Options, Decision, Rationale
4. Set Status to "Proposed"
5. After team review, change to "Accepted"
6. **Never edit an accepted ADR** — create a new one that supersedes it

```markdown
## ADR-0XX: Title

**Date**: YYYY-MM-DD · **Status**: Proposed | Accepted | Superseded by ADR-0YY

**Context**: What is the issue?

**Options Considered**: (table)

**Decision**: What did we choose?

**Rationale**: Why?

**Consequences**: What changes because of this?
```
