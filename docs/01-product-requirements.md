# 📋 Product Requirements Document (PRD)

> **Document ID**: WHISPER-PRD-001  
> **Status**: Approved  
> **Owner**: Engineering  
> **Last Revised**: 2026-06-30  

---

## 1. Executive Summary

Whisper is a production-grade RESTful Blog API built with NestJS and TypeScript. It enables users to register, authenticate, create/manage blog posts, and interact through comments and tags. The system implements enterprise patterns including role-based access control, pagination, caching, rate limiting, and comprehensive testing — serving as both a functional API and a reference implementation of backend engineering best practices.

---

## 2. Problem Statement

There is no internal reference API that demonstrates the full lifecycle of a production backend — from scaffolding to deployment. Engineers need a real-world, well-documented project that covers authentication, authorization, data persistence, validation, testing, and DevOps in a single codebase.

---

## 3. Goals & Success Criteria

| Goal | Measurable Criteria |
|------|-------------------|
| Functional CRUD API | All 5 resource endpoints pass automated E2E tests |
| Secure Authentication | JWT auth with refresh tokens, bcrypt hashing, token invalidation |
| Role-Based Access Control | Admin, Moderator, User roles enforced via Guards on every route |
| Data Integrity | 100% of inputs validated via DTOs with class-validator |
| Performance | GET /posts (cached) responds in < 50ms p95 |
| Test Coverage | ≥ 80% statement + branch coverage across services |
| API Documentation | Auto-generated Swagger/OpenAPI available at `/api/docs` |
| Deployment | Dockerized, deployable to any cloud platform with a single command |

---

## 4. User Roles

| Role | Description | Permissions |
|------|-------------|------------|
| **Guest** | Unauthenticated visitor | Read public posts, view tags |
| **User** | Registered & authenticated | Create/edit/delete own posts and comments, manage own profile |
| **Moderator** | Elevated user | All User permissions + hide/flag posts, manage comments globally |
| **Admin** | System administrator | All permissions + manage users, roles, system configuration |

---

## 5. Functional Requirements

### FR-1: Authentication Module
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | User registration with email, name, password | P0 |
| FR-1.2 | User login returning JWT access + refresh tokens | P0 |
| FR-1.3 | Token refresh endpoint | P0 |
| FR-1.4 | Logout with refresh token invalidation | P0 |
| FR-1.5 | Password hashing with bcrypt (min 10 salt rounds) | P0 |
| FR-1.6 | Password reset via email (optional) | P2 |

### FR-2: Users Module
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Get current user profile (`GET /users/me`) | P0 |
| FR-2.2 | Update own profile (name, bio, avatar) | P0 |
| FR-2.3 | Admin: list all users with pagination | P0 |
| FR-2.4 | Admin: get any user by ID | P0 |
| FR-2.5 | Admin: update user role | P1 |
| FR-2.6 | Admin: soft-delete a user | P1 |

### FR-3: Posts Module
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Create a post (title, content, tags, status) | P0 |
| FR-3.2 | Get all published posts with pagination, search, sort | P0 |
| FR-3.3 | Get a single post by ID or slug | P0 |
| FR-3.4 | Update own post | P0 |
| FR-3.5 | Delete own post (soft delete) | P0 |
| FR-3.6 | Admin/Moderator: manage any post | P1 |
| FR-3.7 | Upload post thumbnail image | P1 |
| FR-3.8 | Post status: DRAFT, PUBLISHED, ARCHIVED | P0 |

### FR-4: Comments Module
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Add a comment to a post | P1 |
| FR-4.2 | List comments for a post (paginated) | P1 |
| FR-4.3 | Edit own comment | P1 |
| FR-4.4 | Delete own comment | P1 |
| FR-4.5 | Moderator: delete any comment | P2 |

### FR-5: Tags Module
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Create a tag (admin only) | P1 |
| FR-5.2 | List all tags | P1 |
| FR-5.3 | Filter posts by tag | P1 |
| FR-5.4 | Many-to-many relationship between posts and tags | P1 |

### FR-6: Health & System
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Health check endpoint (`GET /health`) | P0 |
| FR-6.2 | Auto-generated Swagger docs (`GET /api/docs`) | P0 |
| FR-6.3 | Structured JSON logging | P1 |
| FR-6.4 | Database seeder for development | P2 |

---

## 6. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | **Performance** | API response time < 200ms p95 for uncached endpoints |
| NFR-2 | **Performance** | Cached endpoints (GET /posts) < 50ms p95 |
| NFR-3 | **Security** | All passwords hashed with bcrypt, min 10 rounds |
| NFR-4 | **Security** | JWT access tokens expire in 15 minutes, refresh in 7 days |
| NFR-5 | **Security** | Rate limiting: 100 req/min general, 10 req/min on auth routes |
| NFR-6 | **Security** | Helmet security headers enabled |
| NFR-7 | **Security** | CORS configured with explicit allowed origins |
| NFR-8 | **Reliability** | Health check endpoint for container orchestration |
| NFR-9 | **Scalability** | Stateless JWT auth — no server-side session store required |
| NFR-10 | **Data Integrity** | All inputs validated; whitelist enabled (strip unknown fields) |
| NFR-11 | **Observability** | Structured logging with request ID correlation |
| NFR-12 | **Testing** | ≥ 80% code coverage, E2E suite covering all critical paths |
| NFR-13 | **Deployment** | Multi-stage Docker build, Docker Compose for local dev |

---

## 7. User Stories

### Epic: Authentication
```
US-1: As a visitor, I want to register with my email and password 
      so that I can create an account.
      
      Acceptance Criteria:
      - Email must be valid and unique
      - Password must be ≥ 8 characters
      - Response includes user object (no password field)
      - Returns 201 Created on success
      - Returns 409 Conflict if email exists

US-2: As a registered user, I want to log in with my credentials 
      so that I receive an access token.
      
      Acceptance Criteria:
      - Accepts email + password
      - Returns { access_token, refresh_token } on success
      - Returns 401 Unauthorized on bad credentials

US-3: As an authenticated user, I want to refresh my expired 
      access token without re-entering credentials.
```

### Epic: Blog Posts
```
US-4: As a user, I want to create a blog post with title, content, 
      and tags so that I can publish my writing.

US-5: As a visitor, I want to browse published posts with pagination 
      and search so that I can find interesting content.

US-6: As a post author, I want to edit or delete my own posts 
      so that I can manage my content.

US-7: As an admin, I want to manage any post regardless of 
      ownership so that I can moderate content.
```

### Epic: Comments
```
US-8: As a user, I want to comment on posts so that I can 
      engage with content.

US-9: As a moderator, I want to delete inappropriate comments 
      so that the platform stays clean.
```

---

## 8. Out of Scope (v1.0)

The following features are explicitly **not** part of the initial release:

- Real-time features (WebSockets, SSE)
- Email notifications
- Social login (OAuth — Google, GitHub)
- Full-text search (Elasticsearch)
- Media CDN integration
- GraphQL API
- Frontend / client application
- Payment processing

---

## 9. Constraints & Assumptions

| Type | Description |
|------|-------------|
| **Constraint** | PostgreSQL is the only supported database engine |
| **Constraint** | Prisma ORM is the data access layer (schema-first) |
| **Constraint** | API-only — no server-rendered views |
| **Constraint** | English-only — no i18n in v1.0 |
| **Assumption** | Developers have Node.js v20+ and Docker Desktop installed |
| **Assumption** | PostgreSQL, Redis, and MinIO run via Docker Compose |
| **Assumption** | Redis is available for caching (can degrade gracefully) |
| **Assumption** | File uploads stored in MinIO (S3-compatible, swappable to AWS S3) |

---

## 10. Glossary

| Term | Definition |
|------|-----------|
| **DTO** | Data Transfer Object — a class defining the shape and validation of incoming request data |
| **Guard** | NestJS middleware that determines if a request should be handled (auth, roles) |
| **Interceptor** | NestJS hook that transforms the response or adds cross-cutting logic |
| **Pipe** | NestJS hook that transforms or validates incoming data before the handler |
| **Entity** | A TypeORM class that maps to a database table |
| **Migration** | A versioned SQL change applied to the database schema |
| **RBAC** | Role-Based Access Control — permissions determined by user role |
| **Slug** | A URL-friendly version of a post title (e.g., `my-first-post`) |
