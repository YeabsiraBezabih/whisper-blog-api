# ✅ Task Breakdown — Implementation Plan

> **Document ID**: WHISPER-TASKS-001  
> **Status**: Living Document · **Owner**: Engineering  
> **Rule**: Complete tasks in order. Each phase builds on the previous one.

---

## Phase 0 — Project Bootstrap & Tooling

> **Goal**: Working NestJS project with all tooling configured. Zero features, but the foundation is solid.

- [ ] **T-001**: Install Node.js v20 LTS, pnpm, Git, Docker Desktop, VS Code
- [ ] **T-002**: Install VS Code extensions (ESLint, Prettier, REST Client, GitLens, NestJS Snippets, Prisma)
- [ ] **T-003**: Install NestJS CLI globally (`pnpm install -g @nestjs/cli`)
- [ ] **T-004**: Scaffold NestJS project (`nest new whisper-blog-api --package-manager pnpm`)
- [ ] **T-005**: Verify: `pnpm run start:dev` → `localhost:3000` returns "Hello World"
- [ ] **T-006**: Configure `.prettierrc` with project rules (singleQuote, trailingComma, printWidth)
- [ ] **T-007**: Configure ESLint with `@typescript-eslint` rules
- [ ] **T-008**: Create `.env.example` with all required env vars (see Tech Spec §7)
- [ ] **T-009**: Create `.gitignore` (node_modules, dist, .env, coverage)
- [ ] **T-010**: Initialize Git repo, make initial commit: "chore: scaffold NestJS project"
- [ ] **T-011**: Create GitHub repository and push initial commit

**Definition of Done**: `pnpm run start:dev` works, linting passes, repo is on GitHub.

---

## Phase 1 — Configuration & Common Infrastructure

> **Goal**: Environment management, global pipes/filters/interceptors, and shared utilities — the "plumbing" every module will depend on.

- [ ] **T-012**: Run `docker compose up -d` — start PostgreSQL, Redis, MinIO containers
- [ ] **T-013**: Verify Docker services: `psql` connects, `redis-cli ping`, MinIO console at `localhost:9001`
- [ ] **T-014**: Install `prisma @prisma/client` and initialize: `pnpm exec prisma init`
- [ ] **T-015**: Create `src/prisma/prisma.service.ts` — extends PrismaClient, implements OnModuleInit
- [ ] **T-016**: Create `src/prisma/prisma.module.ts` — global module exporting PrismaService
- [ ] **T-017**: Install `@nestjs/config` and configure `ConfigModule.forRoot({ isGlobal: true })`
- [ ] **T-018**: Create `.env` file with `DATABASE_URL` and all variables from `.env.example`
- [ ] **T-019**: Create `src/config/env.validation.ts` — Joi schema validating all required env vars
- [ ] **T-020**: Create `src/config/jwt.config.ts` — JWT secret + expiration from env vars
- [ ] **T-021**: Create `src/config/minio.config.ts` — MinIO connection options from env vars
- [ ] **T-022**: Create `src/common/filters/http-exception.filter.ts` — standardized error shape
- [ ] **T-023**: Create `src/common/interceptors/transform.interceptor.ts` — wrap responses in `{ data, statusCode }`
- [ ] **T-024**: Create `src/common/interceptors/logging.interceptor.ts` — log method, URL, duration
- [ ] **T-025**: Create `src/common/dto/pagination-query.dto.ts` — page, limit, search, sortBy, order
- [ ] **T-026**: Create `src/common/interfaces/paginated-result.interface.ts`
- [ ] **T-027**: Register global pipes, filters, interceptors in `main.ts`
- [ ] **T-028**: Verify: send a bad request → confirm standardized error response shape

**Definition of Done**: Docker infra running, Prisma connected to PostgreSQL, global pipes/filters/interceptors working.

---

## Phase 2 — Prisma Schema & Users Module

> **Goal**: Prisma schema defined, User model created, first migration run, full CRUD for users with proper validation.

- [ ] **T-029**: Define User model in `prisma/schema.prisma` (see Tech Spec §2)
- [ ] **T-030**: Run first migration: `pnpm exec prisma migrate dev --name init`
- [ ] **T-031**: Verify: tables created in PostgreSQL (use `prisma studio` or TablePlus)
- [ ] **T-032**: Generate Users module: `nest g resource users --no-spec`
- [ ] **T-033**: Create `src/users/dto/create-user.dto.ts` with class-validator decorators
- [ ] **T-034**: Create `src/users/dto/update-user.dto.ts` using `PartialType(CreateUserDto)`
- [ ] **T-035**: Inject `PrismaService` into `UsersService`
- [ ] **T-036**: Implement `UsersService.create()` — hash password, `prisma.user.create()`
- [ ] **T-037**: Implement `UsersService.findAll()` — with pagination via `prisma.user.findMany({ skip, take })`
- [ ] **T-038**: Implement `UsersService.findOne(id)` — throw NotFoundException if missing
- [ ] **T-039**: Implement `UsersService.findByEmail(email)` — for auth use later
- [ ] **T-040**: Implement `UsersService.update(id, dto)` — `prisma.user.update()`
- [ ] **T-041**: Implement `UsersService.remove(id)` — soft delete via `update({ deletedAt: new Date() })`
- [ ] **T-042**: Wire controller routes: GET /users, GET /users/:id, POST /users, PATCH /users/:id, DELETE /users/:id
- [ ] **T-043**: Apply `ParseUUIDPipe` to all `:id` params
- [ ] **T-044**: Test all endpoints in Postman / REST Client
- [ ] **T-045**: Write `users.service.spec.ts` — unit tests for all service methods

**Definition of Done**: Full Users CRUD against real PostgreSQL via Prisma, migrations working, unit tests passing.

---

## Phase 3 — Posts Module

> **Goal**: Complete CRUD for blog posts with author relationship, slug generation, pagination, search, and filtering.

- [ ] **T-046**: Add Post model to `prisma/schema.prisma` with all fields + User relation (see Tech Spec §2)
- [ ] **T-047**: Run migration: `pnpm exec prisma migrate dev --name add-posts`
- [ ] **T-048**: Generate Posts module: `nest g resource posts --no-spec`
- [ ] **T-049**: Create `src/posts/dto/create-post.dto.ts` with validation
- [ ] **T-050**: Create `src/posts/dto/update-post.dto.ts` using PartialType
- [ ] **T-051**: Implement slug generation utility (title → `my-first-post`)
- [ ] **T-052**: Implement `PostsService.create(dto, authorId)` — generate slug, `prisma.post.create({ data: { ...dto, authorId } })`
- [ ] **T-053**: Implement `PostsService.findAll(query)` — pagination, search by title, sort, filter by status
- [ ] **T-054**: Implement `PostsService.findOne(id)` — include author relation via `prisma.post.findUnique({ include: { author: true } })`
- [ ] **T-055**: Implement `PostsService.findBySlug(slug)` — alternative lookup
- [ ] **T-056**: Implement `PostsService.update(id, dto)` — regenerate slug if title changed
- [ ] **T-057**: Implement `PostsService.remove(id)` — soft delete
- [ ] **T-058**: Wire controller routes with proper decorators
- [ ] **T-059**: Test all endpoints in Postman
- [ ] **T-060**: Write `posts.service.spec.ts` — unit tests

**Definition of Done**: Posts CRUD with author relation, slug, pagination, search all working via Prisma.

---

## Phase 4 — Authentication

> **Goal**: Register, login, JWT access + refresh tokens, protected routes, @CurrentUser decorator.

- [ ] **T-061**: Install `@nestjs/passport passport passport-local passport-jwt @nestjs/jwt bcrypt`
- [ ] **T-062**: Install types: `@types/passport-local @types/passport-jwt @types/bcrypt`
- [ ] **T-063**: Generate Auth module: `nest g module auth && nest g service auth && nest g controller auth`
- [ ] **T-064**: Create `src/auth/dto/register.dto.ts` and `src/auth/dto/login.dto.ts`
- [ ] **T-065**: Create `src/auth/dto/refresh-token.dto.ts`
- [ ] **T-066**: Implement `AuthService.register(dto)` — check email uniqueness, hash password, save user
- [ ] **T-067**: Implement `AuthService.validateUser(email, password)` — bcrypt.compare
- [ ] **T-068**: Create `src/auth/strategies/local.strategy.ts` — calls validateUser
- [ ] **T-069**: Configure `JwtModule.registerAsync()` using jwt.config.ts
- [ ] **T-070**: Implement `AuthService.login(user)` — sign access + refresh tokens
- [ ] **T-071**: Create `src/auth/strategies/jwt.strategy.ts` — extract Bearer, verify, check tokenVersion
- [ ] **T-072**: Create `src/common/guards/jwt-auth.guard.ts` — extends AuthGuard('jwt'), respects @Public()
- [ ] **T-073**: Create `src/common/decorators/current-user.decorator.ts` — @CurrentUser()
- [ ] **T-074**: Create `src/common/decorators/public.decorator.ts` — @Public()
- [ ] **T-075**: Implement `AuthService.refreshTokens(userId, refreshToken)` — validate, rotate, return new pair
- [ ] **T-076**: Implement `AuthService.logout(userId)` — clear refresh hash, increment tokenVersion
- [ ] **T-077**: Wire controller: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout, GET /auth/profile
- [ ] **T-078**: Register JwtAuthGuard globally with APP_GUARD
- [ ] **T-079**: Mark public routes with @Public()
- [ ] **T-080**: Test full auth flow in Postman: register → login → access profile → refresh → logout → verify old token fails
- [ ] **T-081**: Write `auth.service.spec.ts` — unit tests

**Definition of Done**: Full auth flow working, protected routes enforce JWT, refresh/logout invalidate tokens.

---

## Phase 5 — Authorization (RBAC)

> **Goal**: Role-based access control on every route. Ownership checks for user-owned resources.

- [ ] **T-082**: Create `src/common/decorators/roles.decorator.ts` — @Roles(Role.ADMIN)
- [ ] **T-083**: Create `src/common/guards/roles.guard.ts` — read roles metadata, compare to req.user.role
- [ ] **T-084**: Register RolesGuard globally with APP_GUARD
- [ ] **T-085**: Apply @Roles() to admin-only routes (GET /users, DELETE /users/:id)
- [ ] **T-086**: Implement ownership check in PostsService.update/remove — author or admin only
- [ ] **T-087**: Implement ownership check in UsersService.update — self or admin only
- [ ] **T-088**: Test all permission scenarios with USER and ADMIN tokens
- [ ] **T-089**: Write guard unit tests

**Definition of Done**: Non-admin users cannot access admin routes. Users can only modify own resources.

---

## Phase 6 — Comments & Tags Modules

> **Goal**: Comments on posts, tags with M:N relationship to posts.

- [ ] **T-090**: Add Comment and Tag models to `prisma/schema.prisma` (see Tech Spec §2)
- [ ] **T-091**: Run migration: `pnpm exec prisma migrate dev --name add-comments-tags`
- [ ] **T-092**: Generate Comments module: `nest g resource comments --no-spec`
- [ ] **T-093**: Implement Comments CRUD (create, findByPost, update own, delete own/mod/admin)
- [ ] **T-094**: Wire nested routes: `/posts/:postId/comments`
- [ ] **T-095**: Generate Tags module: `nest g resource tags --no-spec`
- [ ] **T-096**: Implement Tags CRUD (admin create/delete, public list)
- [ ] **T-097**: Update CreatePostDto to accept `tagIds`
- [ ] **T-098**: Update PostsService.create to connect tags via `prisma.post.create({ data: { tags: { connect: [...] } } })`
- [ ] **T-099**: Add `GET /posts?tag=slug` filter support
- [ ] **T-100**: Test all endpoints, write unit tests

**Definition of Done**: Comments and tags fully functional with proper permissions.

---

## Phase 7 — File Uploads (MinIO) & Swagger

> **Goal**: Post thumbnails via MinIO S3-compatible storage, auto-generated API documentation.

- [ ] **T-101**: Install `@aws-sdk/client-s3 @aws-sdk/s3-request-presigner`
- [ ] **T-102**: Create `src/storage/storage.service.ts` — upload, delete, getPresignedUrl via S3Client
- [ ] **T-103**: Create `src/storage/storage.module.ts` — inject MinIO config
- [ ] **T-104**: Install `multer @types/multer` for multipart parsing
- [ ] **T-105**: Implement `POST /posts/:id/thumbnail` — receive file via `FileInterceptor`, upload to MinIO
- [ ] **T-106**: Store MinIO object key in Post.thumbnail field
- [ ] **T-107**: Install `@nestjs/swagger`
- [ ] **T-108**: Configure SwaggerModule in `main.ts` (title, description, version, bearerAuth)
- [ ] **T-109**: Decorate all DTOs with `@ApiProperty()` (description + example)
- [ ] **T-110**: Decorate all controllers with `@ApiTags()`, `@ApiOperation()`, `@ApiResponse()`
- [ ] **T-111**: Decorate protected routes with `@ApiBearerAuth()`
- [ ] **T-112**: Verify: open `localhost:3000/api/docs` — all endpoints documented

**Definition of Done**: Swagger docs at `/api/docs`, file upload to MinIO working, password never in responses.

---

## Phase 8 — Performance & Security Hardening

> **Goal**: Caching, rate limiting, logging, health checks, security headers.

- [ ] **T-113**: Install `@nestjs/cache-manager cache-manager cache-manager-redis-yet`
- [ ] **T-114**: Configure CacheModule with Redis (graceful fallback to memory)
- [ ] **T-115**: Add `@UseInterceptors(CacheInterceptor)` to GET /posts and GET /tags
- [ ] **T-116**: Implement cache invalidation on POST/PATCH/DELETE
- [ ] **T-117**: Install `@nestjs/throttler`, configure global rate limiting
- [ ] **T-118**: Apply stricter rate limit to auth routes (10 req/min)
- [ ] **T-119**: Install `winston nest-winston`, configure structured logging
- [ ] **T-120**: Replace all console.log with `this.logger.log()` / `.error()`
- [ ] **T-121**: Install `@nestjs/terminus`, create health module
- [ ] **T-122**: Implement `GET /health` — DB check + disk check
- [ ] **T-123**: Install `helmet`, enable in `main.ts`
- [ ] **T-124**: Configure `app.enableCors()` with allowed origins from env
- [ ] **T-125**: Install `compression`, enable in `main.ts`
- [ ] **T-126**: Add database indexes on frequently queried columns (users.email, posts.slug)

**Definition of Done**: Cached endpoints faster, rate limits enforced, structured logs, health check working.

---

## Phase 9 — Testing

> **Goal**: 80%+ code coverage. Unit tests for all services, integration tests for critical paths, E2E tests for full flows.

- [ ] **T-127**: Write unit tests for all remaining untested services
- [ ] **T-128**: Write controller unit tests (mock services, test HTTP status codes)
- [ ] **T-129**: Write guard unit tests (RolesGuard, JwtAuthGuard)
- [ ] **T-130**: Configure test database: `whisper_blog_test`
- [ ] **T-131**: Write E2E: auth flow (register → login → profile → refresh → logout)
- [ ] **T-132**: Write E2E: posts flow (create → list → get → update → delete)
- [ ] **T-133**: Write E2E: permissions (user tries admin route → 403)
- [ ] **T-134**: Run `pnpm run test:cov` → identify and fill coverage gaps
- [ ] **T-135**: Target: ≥ 80% statements and branches

**Definition of Done**: All tests green, coverage report generated, ≥ 80%.

---

## Phase 10 — DevOps & Deployment

> **Goal**: Dockerized app, CI pipeline, deployed to cloud.

- [ ] **T-136**: Verify existing `Dockerfile` builds successfully: `docker build -t whisper-api .`
- [ ] **T-137**: Uncomment API service in `docker-compose.yml`, test full stack: `docker compose up`
- [ ] **T-138**: Verify: app connects to DB, Redis, and MinIO inside Docker network
- [ ] **T-139**: Create `.github/workflows/ci.yml` — lint + test on every push/PR
- [ ] **T-140**: Create Postman collection: full E2E suite with test scripts
- [ ] **T-141**: Export collection + environment as JSON, commit to repo
- [ ] **T-142**: Install Newman, run collection from CLI
- [ ] **T-143**: Deploy to Railway/Render — configure env vars, PostgreSQL addon
- [ ] **T-144**: Run migrations on production: `prisma migrate deploy`
- [ ] **T-145**: Verify live URL responds, Swagger docs accessible
- [ ] **T-146**: Update README: architecture, local setup (`docker compose up`), API docs link, live URL
- [ ] **T-147**: Tag release: `git tag v1.0.0 && git push --tags`

**Definition of Done**: App runs in Docker, CI passes, live URL accessible, README polished.

---

## Progress Tracker

| Phase | Tasks | Description | Status |
|-------|-------|-------------|--------|
| 0 | T-001 → T-011 | Project Bootstrap | ⬜ Not Started |
| 1 | T-012 → T-028 | Docker Infra & Configuration | ⬜ Not Started |
| 2 | T-029 → T-045 | Prisma Schema & Users | ⬜ Not Started |
| 3 | T-046 → T-060 | Posts Module | ⬜ Not Started |
| 4 | T-061 → T-081 | Authentication | ⬜ Not Started |
| 5 | T-082 → T-089 | Authorization (RBAC) | ⬜ Not Started |
| 6 | T-090 → T-100 | Comments & Tags | ⬜ Not Started |
| 7 | T-101 → T-112 | MinIO Uploads & Swagger | ⬜ Not Started |
| 8 | T-113 → T-126 | Performance & Security | ⬜ Not Started |
| 9 | T-127 → T-135 | Testing | ⬜ Not Started |
| 10 | T-136 → T-147 | DevOps & Deployment | ⬜ Not Started |

**Total**: 147 tasks across 11 phases

---

> **Tip**: Check off tasks as you complete them. When a phase is done, update the status to ✅ Complete. This is your single source of truth for progress.
