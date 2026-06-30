# **3. Core Concepts You Will Learn**

Below is a high-level map of every concept this roadmap covers. Don't worry about understanding all of it now — each item will be introduced at the right time in the sprint plan.

## **Phase 1 — Foundations (Weeks 1–3)**

- TypeScript fundamentals: types, interfaces, generics, decorators, async/await

- Node.js basics: event loop, modules (CommonJS vs ESM), streams, http module

- HTTP protocol: request/response cycle, methods (GET POST PUT PATCH DELETE), status codes

- REST API design: endpoints, resource naming conventions, versioning

- NestJS architecture: modules, controllers, providers/services, dependency injection

- Project scaffolding with the Nest CLI

## **Phase 2 — Data & Persistence (Weeks 4–6)**

- Relational database fundamentals: tables, rows, primary keys, foreign keys, indexes

- PostgreSQL: installation, psql CLI, pgAdmin, basic SQL (SELECT INSERT UPDATE DELETE)

- TypeORM: entities, repositories, relations (OneToMany, ManyToMany), migrations

- Prisma ORM (alternative): schema, migrations, Prisma Client, seeding

- CRUD patterns: building complete Create-Read-Update-Delete flows end-to-end

- Data validation: class-validator, class-transformer, ValidationPipe

## **Phase 3 — Security & Auth (Weeks 7–8)**

- Authentication vs Authorization concepts

- JWT (JSON Web Tokens): structure, signing, verifying, expiry, refresh tokens

- Passport.js with NestJS: strategies (Local, JWT)

- Role-based access control (RBAC) with Guards and Decorators

- Hashing passwords with bcrypt

- Protecting routes: AuthGuard, RolesGuard

## **Phase 4 — Advanced NestJS (Weeks 9–10)**

- Interceptors: transform responses, logging, caching

- Exception filters: custom error handling, global filters

- Pipes: custom validation pipes, ParseIntPipe, ParseUUIDPipe

- Guards: custom guards, metadata with SetMetadata

- Middleware: logging, rate limiting, CORS

- Config module: environment variables with @nestjs/config and .env files

- File uploads with Multer

- Pagination, filtering, and sorting patterns

## **Phase 5 — Testing (Weeks 11–12)**

- Unit testing with Jest: describe/it/expect, mocking services and repositories

- Integration testing with Supertest: testing HTTP endpoints

- E2E (end-to-end) testing with Nest's testing module

- Test coverage reports

- Postman: collections, environments, variables, automated tests with scripts

- Postman Newman: running collections in CI pipelines
