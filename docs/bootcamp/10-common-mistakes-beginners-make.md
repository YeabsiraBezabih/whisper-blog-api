# **10. Common Mistakes Beginners Make**

Awareness of these pitfalls will save you days of frustration.

## **TypeScript Mistakes**

- Using any everywhere — it defeats the purpose of TypeScript. Use unknown and narrow it with type guards

- Not enabling strict mode — always set "strict": true in tsconfig.json from day 1

- Confusing type and interface — prefer interface for objects you'll extend; use type for unions

## **NestJS Mistakes**

- Forgetting to import modules — if a service isn't found, you probably forgot to add its module to imports[]

- Putting business logic in controllers — controllers only handle HTTP. All logic belongs in services

- Not using DTOs for validation — always define DTOs with class-validator decorators, never trust raw req.body

- Global ValidationPipe not enabled — add it in main.ts: app.useGlobalPipes(new ValidationPipe({ whitelist: true }))

## **Database Mistakes**

- Not running migrations — direct schema changes in dev without migrations will bite you in production

- N+1 query problem — always check if your TypeORM/Prisma queries are generating unexpected extra SQL queries

- Storing plain text passwords — ALWAYS hash with bcrypt before storing

## **API Design Mistakes**

- Inconsistent status codes — 200 for everything. Use 201 for creation, 204 for deletion, 400 for validation errors

- Leaking internal errors to clients — never send raw database errors to the client; use custom exception filters

- No pagination on list endpoints — returning 10,000 records on GET /posts will crash your app
