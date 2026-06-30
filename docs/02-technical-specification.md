# 🔧 Technical Specification

> **Document ID**: WHISPER-SPEC-001  
> **Status**: Approved · **Owner**: Engineering · **Last Revised**: 2026-06-30  

---

## 1. Technology Stack

| Layer | Technology | Version | Justification |
|-------|-----------|---------|---------------|
| Runtime | Node.js | 20 LTS | Long-term support, ES2023 features |
| Language | TypeScript | 5.7+ | Type safety, decorator support |
| Framework | NestJS | 11.x | Modular architecture, DI, enterprise patterns |
| Database | PostgreSQL | 15+ | ACID compliance, JSON support (via Docker) |
| ORM | Prisma | 6.x | Type-safe client, schema-first, auto migrations |
| Auth | Passport.js + JWT | latest | Industry standard, strategy-based |
| Validation | class-validator | latest | Decorator-based DTO validation |
| Caching | Redis | 7.x | In-memory caching layer (via Docker) |
| Object Storage | MinIO | latest | S3-compatible file storage (via Docker) |
| Docs | Swagger / OpenAPI 3.0 | latest | Auto-generated API docs |
| Testing | Jest + Supertest | latest | Unit + integration + E2E |
| Container | Docker + Docker Compose | latest | Reproducible environments |

---

## 2. Data Models (ERD)

```
users ──1:N──► posts ──1:N──► comments
  │                │
  │                └── M:N ──► tags (via post_tags join table)
  └──1:N──► comments
```

### Prisma Schema (`prisma/schema.prisma`)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  USER
  MODERATOR
  ADMIN
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

model User {
  id                 String    @id @default(uuid())
  email              String    @unique
  name               String    @db.VarChar(100)
  password           String                          // bcrypt hash, never returned
  bio                String?   @db.Text
  avatar             String?                         // MinIO object key
  role               Role      @default(USER)
  tokenVersion       Int       @default(0)           // increment on logout
  hashedRefreshToken String?                         // bcrypt hash
  createdAt          DateTime  @default(now())
  updatedAt          DateTime  @updatedAt
  deletedAt          DateTime?                       // soft delete

  posts    Post[]
  comments Comment[]

  @@index([email])
  @@map("users")
}

model Post {
  id        String     @id @default(uuid())
  title     String     @db.VarChar(255)
  slug      String     @unique
  content   String     @db.Text
  thumbnail String?                                  // MinIO object key
  status    PostStatus @default(DRAFT)
  createdAt DateTime   @default(now())
  updatedAt DateTime   @updatedAt
  deletedAt DateTime?                                // soft delete

  author   User   @relation(fields: [authorId], references: [id])
  authorId String @map("author_id")

  comments Comment[]
  tags     Tag[]

  @@index([slug])
  @@index([authorId])
  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid())
  content   String   @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  author   User   @relation(fields: [authorId], references: [id])
  authorId String @map("author_id")

  post   Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  postId String @map("post_id")

  @@map("comments")
}

model Tag {
  id        String   @id @default(uuid())
  name      String   @unique @db.VarChar(50)
  slug      String   @unique
  createdAt DateTime @default(now())

  posts Post[]

  @@map("tags")
}
```

---

## 3. API Endpoints

### Auth (`/auth`)
| Method | Endpoint | Auth | Body | Status |
|--------|----------|------|------|--------|
| POST | `/auth/register` | None | RegisterDto | 201 |
| POST | `/auth/login` | None | LoginDto | 200 |
| POST | `/auth/refresh` | None | `{ refresh_token }` | 200 |
| POST | `/auth/logout` | JWT | — | 204 |
| GET | `/auth/profile` | JWT | — | 200 |

### Users (`/users`)
| Method | Endpoint | Auth | Role | Status |
|--------|----------|------|------|--------|
| GET | `/users` | JWT | Admin | 200 |
| GET | `/users/:id` | JWT | Admin | 200 |
| PATCH | `/users/:id` | JWT | Owner/Admin | 200 |
| DELETE | `/users/:id` | JWT | Admin | 204 |

### Posts (`/posts`)
| Method | Endpoint | Auth | Role | Status |
|--------|----------|------|------|--------|
| POST | `/posts` | JWT | User+ | 201 |
| GET | `/posts` | Public | — | 200 |
| GET | `/posts/:id` | Public | — | 200 |
| PATCH | `/posts/:id` | JWT | Owner/Admin | 200 |
| DELETE | `/posts/:id` | JWT | Owner/Admin | 204 |
| POST | `/posts/:id/thumbnail` | JWT | Owner | 200 |

### Comments (`/posts/:postId/comments`)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/posts/:postId/comments` | JWT | 201 |
| GET | `/posts/:postId/comments` | Public | 200 |
| PATCH | `/comments/:id` | JWT (Owner) | 200 |
| DELETE | `/comments/:id` | JWT (Owner/Mod/Admin) | 204 |

### Tags (`/tags`) & Health (`/health`)
| Method | Endpoint | Auth | Status |
|--------|----------|------|--------|
| POST | `/tags` | JWT (Admin) | 201 |
| GET | `/tags` | Public | 200 |
| DELETE | `/tags/:id` | JWT (Admin) | 204 |
| GET | `/health` | Public | 200 |

---

## 4. Response Contracts

### Success
```json
{ "data": { ... }, "statusCode": 200 }
```

### Paginated
```json
{
  "data": [ ... ],
  "meta": { "page": 1, "limit": 10, "total": 47, "lastPage": 5 },
  "statusCode": 200
}
```

### Error
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "constraints": { "isEmail": "must be valid email" } }],
  "timestamp": "2026-06-30T12:00:00.000Z",
  "path": "/auth/register"
}
```

---

## 5. DTO Validation Rules

| DTO | Field | Decorators |
|-----|-------|-----------|
| RegisterDto | name | `@IsString() @MinLength(2) @MaxLength(100)` |
| | email | `@IsEmail()` |
| | password | `@IsString() @MinLength(8) @MaxLength(72)` |
| LoginDto | email | `@IsEmail()` |
| | password | `@IsString()` |
| CreatePostDto | title | `@IsString() @MinLength(3) @MaxLength(255)` |
| | content | `@IsString() @MinLength(10)` |
| | status | `@IsOptional() @IsEnum(PostStatus)` |
| | tagIds | `@IsOptional() @IsUUID('4', { each: true })` |
| CreateCommentDto | content | `@IsString() @MinLength(1) @MaxLength(2000)` |
| PaginationQueryDto | page | `@IsOptional() @Min(1)` default: 1 |
| | limit | `@IsOptional() @Min(1) @Max(100)` default: 10 |
| | search | `@IsOptional() @IsString()` |
| | sortBy | `@IsOptional() @IsIn(['createdAt','title'])` |
| | order | `@IsOptional() @IsIn(['ASC','DESC'])` |

---

## 6. Auth Flow & JWT Architecture

```
Register → Login → Access Token (15min) → API Calls
                 → Refresh Token (7d) → Renew on expiry
Logout → Invalidate refresh token + increment tokenVersion
```

**JWT Payload**: `{ sub, email, role, tokenVersion, iat, exp }`

**Guard Order**: `JwtAuthGuard → RolesGuard → OwnershipGuard → Handler`

---

## 7. Environment Variables

```bash
NODE_ENV=development                    # development | production | test
PORT=3000

# Database (Prisma uses a single connection string)
DATABASE_URL=postgresql://whisper:whisper_secret@localhost:5432/whisper_blog_dev?schema=public

# JWT
JWT_SECRET=                             # min 32 chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Redis (Docker: localhost:6379)
REDIS_HOST=localhost
REDIS_PORT=6379

# MinIO / S3 (Docker: localhost:9000, Console: localhost:9001)
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
MINIO_BUCKET_NAME=whisper-uploads
MINIO_USE_SSL=false

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=10
```

---

## 8. Error Code Reference

| Status | Name | Usage |
|--------|------|-------|
| 200 | OK | Successful GET/PATCH |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate (e.g., email) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Error | Unhandled exception |

---

## 9. Security Checklist

- [ ] Passwords hashed with bcrypt (≥ 10 rounds)
- [ ] Passwords NEVER in API responses (`@Exclude()`)
- [ ] JWT secrets ≥ 32 chars, env-only
- [ ] Helmet middleware enabled
- [ ] CORS with explicit `allowedOrigins`
- [ ] Rate limiting: 100/min general, 10/min auth
- [ ] `ValidationPipe({ whitelist: true, forbidNonWhitelisted: true })`
- [ ] File uploads: type + size validation
- [ ] No raw error details in production

---

## 10. Caching & Migration Rules

**Caching** (Redis-backed, graceful fallback to in-memory):
| Endpoint | TTL | Invalidation |
|----------|-----|-------------|
| GET /posts | 60s | Any write to /posts |
| GET /posts/:id | 120s | Write to that post |
| GET /tags | 300s | Write to /tags |

**Prisma Migrations**:
| Command | Purpose |
|---------|--------|
| `pnpm exec prisma migrate dev --name <name>` | Create + apply a migration in development |
| `pnpm exec prisma migrate deploy` | Apply pending migrations in production |
| `pnpm exec prisma generate` | Regenerate Prisma Client after schema changes |
| `pnpm exec prisma studio` | Open visual DB browser at localhost:5555 |
| `pnpm exec prisma db seed` | Run the seed script |

**Migration Rules**: Migrations are immutable once committed. Name descriptively (`add-thumbnail-to-post`). Always run `prisma generate` after schema changes.

---

## 11. Infrastructure (Docker Services)

All infrastructure runs via `docker compose up -d`. No local installation of PostgreSQL, Redis, or MinIO required.

| Service | Port | Purpose | Console |
|---------|------|---------|---------|
| PostgreSQL | 5432 | Primary database | psql or Prisma Studio |
| Redis | 6379 | Caching + rate limiting | redis-cli |
| MinIO (S3 API) | 9000 | File/image storage | — |
| MinIO Console | 9001 | Web UI for MinIO | http://localhost:9001 |

**File Storage**: Post thumbnails and user avatars are uploaded to MinIO via the `@aws-sdk/client-s3` package (MinIO is S3-compatible). Files are stored with keys like `posts/{postId}/thumbnail.webp` and served via presigned URLs or a public bucket policy.
