# **11. Quick Reference Cheatsheet**

## **NestJS CLI Commands**

- nest new <name> — scaffold new project

- nest generate module <name> (alias: g mo)

- nest generate controller <name> (alias: g co)

- nest generate service <name> (alias: g s)

- nest generate resource <name> — generates full CRUD module

- nest build — compile TypeScript

- npm run start:dev — start with hot reload

## **HTTP Status Codes Reference**

- 200 OK — successful GET / PUT / PATCH

- 201 Created — successful POST (new resource created)

- 204 No Content — successful DELETE

- 400 Bad Request — validation error / malformed request

- 401 Unauthorized — not authenticated (no/invalid token)

- 403 Forbidden — authenticated but not authorized

- 404 Not Found — resource doesn't exist

- 409 Conflict — duplicate resource (e.g., email already registered)

- 422 Unprocessable Entity — semantic validation error

- 500 Internal Server Error — unexpected server crash

## **TypeORM Quick Reference**

- @Entity() — mark a class as a database table

- @Column() — map a property to a table column

- @PrimaryGeneratedColumn("uuid") — auto UUID primary key

- @CreateDateColumn() / @UpdateDateColumn() — automatic timestamps

- @OneToMany(() => Post, (post) => post.user) — one user, many posts

- @ManyToOne(() => User, (user) => user.posts) — post belongs to user

## **JWT Flow Summary**

1. User sends POST /auth/login with email + password

1. Server validates credentials, hashes match → success

1. Server signs a JWT with user ID and role in payload

1. Server returns { access_token: "eyJ..." }

1. Client stores token (memory or localStorage)

1. Client sends Authorization: Bearer eyJ... on every protected request

1. JWT Guard extracts and verifies token → attaches user to request
