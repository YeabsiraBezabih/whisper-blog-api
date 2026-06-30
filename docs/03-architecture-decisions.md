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

**Rationale**: NestJS enforces separation of concerns (modules, controllers, services) from day one. Its dependency injection system mirrors enterprise frameworks (Spring Boot, ASP.NET). The decorator-based approach maps naturally to TypeScript. The ecosystem (`@nestjs/passport`, `@nestjs/swagger`, `@nestjs/typeorm`) reduces integration boilerplate significantly.

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

**Rationale**: `strictNullChecks` catches null/undefined errors at compile time. `emitDecoratorMetadata` is required by NestJS DI and TypeORM. ES2023 target enables modern syntax without transpilation overhead.

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

## ADR-004: TypeORM as the Object-Relational Mapper

**Date**: 2026-06-30 · **Status**: Accepted

**Context**: We need an ORM that integrates natively with NestJS and supports TypeScript decorators.

**Options Considered**:
| Option | Pros | Cons |
|--------|------|------|
| **TypeORM** | Native NestJS integration, decorator entities, migrations | Inconsistent API, some bugs in 0.3.x |
| Prisma | Excellent DX, type-safe client, schema-first | Different paradigm, no decorator entities |
| MikroORM | Unit of work pattern, great TS support | Smaller ecosystem |
| Drizzle | Lightweight, SQL-like syntax | Very new, no NestJS module |
| Raw SQL (pg) | Full control | No migration system, manual mapping |

**Decision**: Use **TypeORM 0.3.x** via `@nestjs/typeorm`.

**Rationale**: TypeORM's decorator-based entity definitions align perfectly with NestJS's decorator-driven architecture. The `@nestjs/typeorm` package provides seamless module integration (`TypeOrmModule.forRoot()`, `TypeOrmModule.forFeature()`). Migration support is built-in.

**Trade-off acknowledged**: TypeORM 0.3.x has known quirks. If migration to Prisma becomes desirable, the service layer abstraction means only repository calls need changing — controllers and DTOs remain untouched.

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

**Decision**: Users and Posts use soft deletes (`@DeleteDateColumn()`) rather than hard deletes.

**Rationale**: Soft deletes allow data recovery, audit trails, and prevent broken foreign key references. Queries automatically exclude soft-deleted records via TypeORM's built-in filtering.

---

## ADR-012: Multi-Stage Docker Build

**Date**: 2026-06-30 · **Status**: Accepted

**Decision**: Use a multi-stage Dockerfile:
- **Stage 1** (builder): Install deps, compile TypeScript
- **Stage 2** (runner): Copy only `dist/` and production `node_modules`

**Rationale**: Final image is ~150MB instead of ~800MB. No TypeScript compiler, no dev dependencies, no source code in production image.

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
