# 📁 Folder Structure & Conventions

> **Document ID**: WHISPER-FS-001  
> **Status**: Approved · **Owner**: Engineering  

---

## 1. Target Folder Structure

```
whisper-blog-api/
├── docs/                              # ← You are here
│   ├── README.md                      # Documentation index
│   ├── 01-product-requirements.md
│   ├── 02-technical-specification.md
│   ├── 03-architecture-decisions.md
│   ├── 04-folder-structure.md
│   └── 05-task-breakdown.md
│
├── src/
│   ├── main.ts                        # App bootstrap (pipes, filters, swagger, cors)
│   ├── app.module.ts                  # Root module — imports all feature modules
│   │
│   ├── common/                        # Shared utilities used across all modules
│   │   ├── constants/
│   │   │   └── index.ts               # App-wide constants (pagination defaults, etc.)
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts   # @CurrentUser() param decorator
│   │   │   ├── public.decorator.ts         # @Public() route decorator
│   │   │   └── roles.decorator.ts          # @Roles(Role.ADMIN) decorator
│   │   ├── enums/
│   │   │   ├── role.enum.ts                # USER, MODERATOR, ADMIN
│   │   │   └── post-status.enum.ts         # DRAFT, PUBLISHED, ARCHIVED
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts    # Global exception filter
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts           # Extends AuthGuard('jwt')
│   │   │   └── roles.guard.ts              # RBAC guard using Reflector
│   │   ├── interceptors/
│   │   │   ├── transform.interceptor.ts    # Wrap responses in { data, statusCode }
│   │   │   └── logging.interceptor.ts      # Request/response logging
│   │   ├── pipes/
│   │   │   └── parse-positive-int.pipe.ts  # Custom pipe for pagination params
│   │   ├── dto/
│   │   │   └── pagination-query.dto.ts     # Shared pagination DTO
│   │   └── interfaces/
│   │       └── paginated-result.interface.ts
│   │
│   ├── config/                        # Configuration modules
│   │   ├── app.config.ts              # PORT, NODE_ENV
│   │   ├── database.config.ts         # TypeORM connection options
│   │   ├── jwt.config.ts              # JWT secret, expiration
│   │   └── env.validation.ts          # Joi schema for .env validation
│   │
│   ├── auth/                          # Authentication module
│   │   ├── auth.module.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   ├── auth.controller.spec.ts
│   │   ├── auth.service.spec.ts
│   │   ├── dto/
│   │   │   ├── register.dto.ts
│   │   │   ├── login.dto.ts
│   │   │   └── refresh-token.dto.ts
│   │   └── strategies/
│   │       ├── local.strategy.ts      # Username/password validation
│   │       └── jwt.strategy.ts        # Bearer token extraction + verify
│   │
│   ├── users/                         # Users module
│   │   ├── users.module.ts
│   │   ├── users.controller.ts
│   │   ├── users.service.ts
│   │   ├── users.controller.spec.ts
│   │   ├── users.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts
│   │   │   └── update-user.dto.ts
│   │   └── entities/
│   │       └── user.entity.ts
│   │
│   ├── posts/                         # Posts module
│   │   ├── posts.module.ts
│   │   ├── posts.controller.ts
│   │   ├── posts.service.ts
│   │   ├── posts.controller.spec.ts
│   │   ├── posts.service.spec.ts
│   │   ├── dto/
│   │   │   ├── create-post.dto.ts
│   │   │   └── update-post.dto.ts
│   │   └── entities/
│   │       └── post.entity.ts
│   │
│   ├── comments/                      # Comments module
│   │   ├── comments.module.ts
│   │   ├── comments.controller.ts
│   │   ├── comments.service.ts
│   │   ├── dto/
│   │   │   ├── create-comment.dto.ts
│   │   │   └── update-comment.dto.ts
│   │   └── entities/
│   │       └── comment.entity.ts
│   │
│   ├── tags/                          # Tags module
│   │   ├── tags.module.ts
│   │   ├── tags.controller.ts
│   │   ├── tags.service.ts
│   │   ├── dto/
│   │   │   └── create-tag.dto.ts
│   │   └── entities/
│   │       └── tag.entity.ts
│   │
│   └── health/                        # Health check module
│       ├── health.module.ts
│       └── health.controller.ts
│
├── test/                              # E2E tests
│   ├── jest-e2e.json
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   └── posts.e2e-spec.ts
│
├── migrations/                        # TypeORM migration files
│   └── (auto-generated)
│
├── uploads/                           # File upload destination (gitignored)
│
├── .env                               # Environment variables (gitignored)
├── .env.example                       # Template (committed)
├── .gitignore
├── .prettierrc
├── .eslintrc.js
├── nest-cli.json
├── tsconfig.json
├── tsconfig.build.json
├── package.json
├── pnpm-lock.yaml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

---

## 2. Module Structure Rules

Every feature module follows an identical internal layout:

```
<module-name>/
├── <module-name>.module.ts           # @Module() definition
├── <module-name>.controller.ts       # HTTP layer — routes only
├── <module-name>.service.ts          # Business logic
├── <module-name>.controller.spec.ts  # Controller unit tests
├── <module-name>.service.spec.ts     # Service unit tests
├── dto/                              # Request validation
│   ├── create-<resource>.dto.ts
│   └── update-<resource>.dto.ts
└── entities/                         # Database models
    └── <resource>.entity.ts
```

**Why this matters**: Any engineer can open any module and instantly know where the controller, service, DTOs, entities, and tests are. Zero guessing.

---

## 3. Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Files | `kebab-case` | `create-post.dto.ts` |
| Classes | `PascalCase` | `CreatePostDto`, `PostsService` |
| Interfaces | `PascalCase` with `I` prefix (optional) | `PaginatedResult<T>` |
| Enums | `PascalCase` | `Role`, `PostStatus` |
| Enum values | `UPPER_CASE` or `lowercase` string | `Role.ADMIN = 'admin'` |
| Variables | `camelCase` | `accessToken`, `userId` |
| Constants | `SCREAMING_SNAKE_CASE` | `DEFAULT_PAGE_SIZE` |
| DB Tables | `snake_case`, plural | `users`, `posts`, `post_tags` |
| DB Columns | `snake_case` | `created_at`, `author_id` |
| Routes | `kebab-case`, plural nouns | `/posts`, `/auth/refresh` |
| Test files | `*.spec.ts` (unit), `*.e2e-spec.ts` (E2E) | `posts.service.spec.ts` |

---

## 4. Import Rules

```typescript
// ✅ Correct import order (enforced by ESLint)
// 1. Node.js built-ins
import { join } from 'path';

// 2. Third-party packages
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

// 3. Internal modules (absolute from src/)
import { Role } from '../common/enums/role.enum';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';

// 4. Same-module imports
import { CreatePostDto } from './dto/create-post.dto';
import { Post } from './entities/post.entity';
```

---

## 5. Directory Purpose Reference

| Directory | Contains | Who touches it |
|-----------|----------|---------------|
| `src/common/` | Shared code used by 2+ modules | Any engineer |
| `src/config/` | Environment loading + validation | DevOps / lead |
| `src/<module>/` | Feature-specific controller, service, DTOs, entities | Module owner |
| `src/<module>/dto/` | Incoming request shapes + validation | Any engineer |
| `src/<module>/entities/` | TypeORM entity definitions | After migration review |
| `test/` | E2E integration tests | QA / any engineer |
| `migrations/` | Database schema changes | Auto-generated, reviewed |
| `docs/` | Project documentation | Lead / all engineers |

---

## 6. Rules for Creating New Modules

1. **Use the Nest CLI**: `pnpm exec nest g resource <name>` generates the full scaffold
2. **Register in AppModule**: Add the new module to `imports[]` in `app.module.ts`
3. **Create DTOs before writing service logic**: Validation-first development
4. **Create the entity before writing the service**: Schema-first development
5. **Write tests as you code**: Each service method gets a unit test immediately
6. **One entity per file**: Never put multiple entities in the same file

---

## 7. Files That Must NEVER Be Committed

```gitignore
# These MUST be in .gitignore
node_modules/
dist/
.env                   # Contains secrets
uploads/               # User-uploaded files
coverage/              # Test coverage reports
*.log
```

**Files that MUST be committed**:
```
.env.example           # Template with empty values
.prettierrc            # Formatting rules
eslint.config.mjs      # Linting rules
tsconfig.json          # TypeScript config
nest-cli.json          # NestJS CLI config
docker-compose.yml     # Local dev environment
Dockerfile             # Production build
```
