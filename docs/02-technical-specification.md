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
| Database | PostgreSQL | 15+ | ACID compliance, JSON support |
| ORM | TypeORM | 0.3.x | Decorator-based entities, migrations |
| Auth | Passport.js + JWT | latest | Industry standard, strategy-based |
| Validation | class-validator | latest | Decorator-based DTO validation |
| Caching | Redis via cache-manager | latest | In-memory caching layer |
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

### Enums
```typescript
enum Role { USER = 'user', MODERATOR = 'moderator', ADMIN = 'admin' }
enum PostStatus { DRAFT = 'draft', PUBLISHED = 'published', ARCHIVED = 'archived' }
```

### User Entity
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK, auto-generated | |
| email | VARCHAR(255) | UNIQUE, NOT NULL, indexed | lowercase |
| name | VARCHAR(100) | NOT NULL | |
| password | TEXT | NOT NULL | bcrypt hash, `@Exclude()` |
| bio | TEXT | nullable | |
| avatar | VARCHAR | nullable | file path |
| role | ENUM(Role) | default: USER | |
| tokenVersion | INT | default: 0 | increment on logout |
| hashedRefreshToken | TEXT | nullable | bcrypt hash, `@Exclude()` |
| createdAt | TIMESTAMP | auto | |
| updatedAt | TIMESTAMP | auto | |
| deletedAt | TIMESTAMP | nullable | soft delete |

### Post Entity
| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | UUID | PK | |
| title | VARCHAR(255) | NOT NULL | |
| slug | VARCHAR | UNIQUE, indexed | auto from title |
| content | TEXT | NOT NULL | |
| thumbnail | VARCHAR | nullable | file path |
| status | ENUM(PostStatus) | default: DRAFT | |
| author_id | UUID | FK → users, NOT NULL | |
| createdAt / updatedAt / deletedAt | TIMESTAMP | | soft delete |

### Comment Entity
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| content | TEXT | NOT NULL |
| author_id | UUID | FK → users |
| post_id | UUID | FK → posts, CASCADE delete |
| createdAt / updatedAt | TIMESTAMP | |

### Tag Entity
| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | VARCHAR(50) | UNIQUE |
| slug | VARCHAR | UNIQUE |
| createdAt | TIMESTAMP | |

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
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=whisper_blog_dev
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=                      # .env only
DATABASE_SYNCHRONIZE=false              # NEVER true in production
JWT_SECRET=                             # min 32 chars
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
REDIS_HOST=localhost
REDIS_PORT=6379
THROTTLE_TTL=60
THROTTLE_LIMIT=100
THROTTLE_AUTH_LIMIT=10
UPLOAD_DEST=./uploads
UPLOAD_MAX_SIZE=2097152                 # 2 MB
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

**Migrations**: Never `synchronize: true` in prod. Generate, don't hand-write. Immutable once committed. Name descriptively (`AddThumbnailToPost`).
