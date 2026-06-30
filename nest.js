const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType,
  LevelFormat, PageBreak, PageNumber, Header, Footer, TabStopType,
  TabStopPosition
} = require('docx');
const fs = require('fs');

// ── Color palette ──────────────────────────────────────────────
const COLORS = {
  primary:    '1A56DB',   // deep blue
  secondary:  '0E9F6E',   // teal/green
  accent:     'E3A008',   // amber
  danger:     'E02424',   // red
  light:      'EBF5FB',   // light blue bg
  lightGreen: 'ECFDF5',
  lightAmber: 'FFFBEB',
  headerBg:   '1E3A5F',   // dark navy for header cells
  white:      'FFFFFF',
  gray100:    'F9FAFB',
  gray200:    'E5E7EB',
  gray700:    '374151',
  black:      '111827',
};

const border = { style: BorderStyle.SINGLE, size: 1, color: COLORS.gray200 };
const borders = { top: border, bottom: border, left: border, right: border };
const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder };

// ── Helpers ────────────────────────────────────────────────────
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, font: 'Arial', size: 36, bold: true, color: COLORS.headerBg })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text, font: 'Arial', size: 28, bold: true, color: COLORS.primary })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: 'Arial', size: 24, bold: true, color: COLORS.secondary })],
  });
}
function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: COLORS.gray700, ...opts })],
  });
}
function bullet(text, bold = false) {
  return new Paragraph({
    numbering: { reference: 'bullets', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: COLORS.gray700, bold })],
  });
}
function numbered(text) {
  return new Paragraph({
    numbering: { reference: 'numbers', level: 0 },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: 'Arial', size: 22, color: COLORS.gray700 })],
  });
}
function spacer(lines = 1) {
  return new Paragraph({ children: [new TextRun({ text: '', size: 22 * lines })] });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}
function divider() {
  return new Paragraph({
    spacing: { before: 160, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.gray200 } },
    children: [new TextRun({ text: '' })],
  });
}

function headerCell(text, width, bgColor = COLORS.headerBg) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 100, bottom: 100, left: 140, right: 140 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({ text, font: 'Arial', size: 20, bold: true, color: COLORS.white })],
    })],
  });
}
function dataCell(text, width, bgColor = COLORS.white, bold = false, color = COLORS.gray700) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: [new Paragraph({
      children: [new TextRun({ text, font: 'Arial', size: 20, bold, color })],
    })],
  });
}
function dataCellLines(lines, width, bgColor = COLORS.white) {
  return new TableCell({
    borders,
    width: { size: width, type: WidthType.DXA },
    shading: { fill: bgColor, type: ShadingType.CLEAR },
    margins: { top: 80, bottom: 80, left: 140, right: 140 },
    children: lines.map(l => new Paragraph({
      spacing: { before: 20, after: 20 },
      children: [new TextRun({ text: l, font: 'Arial', size: 20, color: COLORS.gray700 })],
    })),
  });
}

function infoBox(label, text, bg = COLORS.light, borderColor = COLORS.primary) {
  return new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: [9360],
    rows: [
      new TableRow({ children: [
        new TableCell({
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: borderColor },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
            left: { style: BorderStyle.SINGLE, size: 12, color: borderColor },
            right: { style: BorderStyle.SINGLE, size: 1, color: borderColor },
          },
          width: { size: 9360, type: WidthType.DXA },
          shading: { fill: bg, type: ShadingType.CLEAR },
          margins: { top: 120, bottom: 120, left: 200, right: 200 },
          children: [
            new Paragraph({ children: [new TextRun({ text: label, font: 'Arial', size: 20, bold: true, color: borderColor })] }),
            new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, color: COLORS.gray700 })] }),
          ],
        })
      ]})
    ]
  });
}

// ── Sprint Table Builder ───────────────────────────────────────
function sprintTable(weeks) {
  // weeks: [{week, title, topics:[], resources:[], goal}]
  const COL = [600, 1800, 3300, 2460, 1200];
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Week', COL[0]),
        headerCell('Phase / Title', COL[1]),
        headerCell('Topics Covered', COL[2]),
        headerCell('Resources', COL[3]),
        headerCell('Deliverable', COL[4]),
      ]
    }),
    ...weeks.map((w, i) => new TableRow({
      children: [
        dataCell(`Wk ${w.week}`, COL[0], i % 2 === 0 ? COLORS.gray100 : COLORS.white, true, COLORS.primary),
        dataCell(w.title, COL[1], i % 2 === 0 ? COLORS.gray100 : COLORS.white, true, COLORS.headerBg),
        dataCellLines(w.topics, COL[2], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
        dataCellLines(w.resources, COL[3], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
        dataCell(w.goal, COL[4], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
      ]
    }))
  ];
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL, rows });
}

// ── Daily Plan Table ────────────────────────────────────────────
function dailyTable(days) {
  const COL = [800, 1200, 3680, 3680];
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Day', COL[0]),
        headerCell('Time', COL[1]),
        headerCell('Morning Session (1.5–2 hrs)', COL[2]),
        headerCell('Evening Session (1.5–2 hrs)', COL[3]),
      ]
    }),
    ...days.map((d, i) => new TableRow({
      children: [
        dataCell(d.day, COL[0], i % 2 === 0 ? COLORS.lightGreen : COLORS.white, true, COLORS.secondary),
        dataCell(d.time, COL[1], i % 2 === 0 ? COLORS.lightGreen : COLORS.white),
        dataCellLines(d.morning, COL[2], i % 2 === 0 ? COLORS.lightGreen : COLORS.white),
        dataCellLines(d.evening, COL[3], i % 2 === 0 ? COLORS.lightGreen : COLORS.white),
      ]
    }))
  ];
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL, rows });
}

// ── Resources Reference Table ───────────────────────────────────
function resourceTable(items) {
  const COL = [2200, 1600, 2000, 3560];
  const rows = [
    new TableRow({
      tableHeader: true,
      children: [
        headerCell('Resource', COL[0]),
        headerCell('Type', COL[1]),
        headerCell('Topic', COL[2]),
        headerCell('URL / Where to Find', COL[3]),
      ]
    }),
    ...items.map((r, i) => new TableRow({
      children: [
        dataCell(r.name, COL[0], i % 2 === 0 ? COLORS.gray100 : COLORS.white, true),
        dataCell(r.type, COL[1], i % 2 === 0 ? COLORS.gray100 : COLORS.white, false, COLORS.secondary),
        dataCell(r.topic, COL[2], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
        dataCell(r.url, COL[3], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
      ]
    }))
  ];
  return new Table({ width: { size: 9360, type: WidthType.DXA }, columnWidths: COL, rows });
}

// ══════════════════════════════════════════════════════════════
//  DOCUMENT CONTENT
// ══════════════════════════════════════════════════════════════
const children = [];

// ── Cover "page" ───────────────────────────────────────────────
children.push(
  spacer(4),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 120 },
    children: [new TextRun({ text: 'BACKEND ENGINEERING', font: 'Arial', size: 64, bold: true, color: COLORS.headerBg })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'Complete Beginner Roadmap', font: 'Arial', size: 40, color: COLORS.primary })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: 'TypeScript · NestJS · PostgreSQL · REST APIs · VS Code · Postman', font: 'Arial', size: 24, color: COLORS.secondary, italics: true })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 0 },
    children: [new TextRun({ text: '12-Week Sprint Plan  |  12-Week Daily Schedule  |  Full Resource Directory', font: 'Arial', size: 22, color: COLORS.gray700 })],
  }),
  spacer(8),
  pageBreak(),
);

// ── Section 1: Introduction ────────────────────────────────────
children.push(
  h1('1. What Is Backend Engineering?'),
  body('Backend engineering is the discipline of building the server-side of software applications — the logic, databases, APIs, and infrastructure that make a product work behind the scenes. While users never see it directly, every tap, click, and search hits your backend.'),
  spacer(),
  h2('Key Responsibilities of a Backend Engineer'),
  bullet('Design and build REST (or GraphQL) APIs that frontend apps and mobile clients consume'),
  bullet('Model and manage databases — both relational (PostgreSQL) and non-relational (MongoDB)'),
  bullet('Implement authentication, authorization, and security measures'),
  bullet('Write business logic: the rules and workflows that define how your app behaves'),
  bullet('Ensure performance, scalability, and reliability of services'),
  bullet('Write automated tests and documentation'),
  spacer(),
  h2('Why TypeScript + NestJS?'),
  body('TypeScript gives JavaScript a type system, making large codebases safer and more maintainable. NestJS is a progressive Node.js framework built on top of TypeScript that enforces architectural patterns (modules, controllers, services, providers) similar to Angular or Spring Boot — giving you structure from day one.'),
  spacer(),
  infoBox('Your Stack at a Glance',
    'Language: TypeScript  |  Framework: NestJS  |  Database: PostgreSQL  |  ORM: TypeORM / Prisma  |  Editor: VS Code  |  API Testing: Postman  |  Version Control: Git + GitHub',
    COLORS.light, COLORS.primary),
  spacer(),
  divider(),
);

// ── Section 2: Prerequisites ───────────────────────────────────
children.push(
  h1('2. Prerequisites & Environment Setup'),
  body('Before writing a single line of NestJS, you need a solid foundation and a working development environment. This section covers everything you need to install and configure.'),
  spacer(),
  h2('Software to Install'),
  bullet('Node.js (v20 LTS) — https://nodejs.org — the JavaScript runtime NestJS runs on'),
  bullet('npm (comes with Node) or pnpm / yarn for package management'),
  bullet('VS Code — https://code.visualstudio.com — your code editor'),
  bullet('Git — https://git-scm.com — version control'),
  bullet('Postman — https://www.postman.com/downloads — API testing client'),
  bullet('PostgreSQL (v15+) — https://www.postgresql.org/download — your database'),
  bullet('TablePlus or DBeaver — GUI tools to inspect your database visually'),
  spacer(),
  h2('Essential VS Code Extensions'),
  bullet('ESLint — real-time linting'),
  bullet('Prettier — Code Formatter — auto-format on save'),
  bullet('REST Client — test APIs right inside VS Code'),
  bullet('GitLens — enhanced Git capabilities'),
  bullet('TypeScript + Webpack Problem Matchers'),
  bullet('NestJS Snippets — productivity shortcuts for NestJS'),
  bullet('Prisma — syntax highlighting for Prisma schema files'),
  bullet('Thunder Client — lightweight Postman alternative inside VS Code'),
  spacer(),
  h2('Install the NestJS CLI'),
  new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  npm install -g @nestjs/cli', font: 'Courier New', size: 22, color: COLORS.white })],
  }),
  body('Then scaffold your first project: nest new my-app'),
  spacer(),
  divider(),
);

// ── Section 3: Core Concepts Map ──────────────────────────────
children.push(
  h1('3. Core Concepts You Will Learn'),
  body('Below is a high-level map of every concept this roadmap covers. Don\'t worry about understanding all of it now — each item will be introduced at the right time in the sprint plan.'),
  spacer(),
  h2('Phase 1 — Foundations (Weeks 1–3)'),
  bullet('TypeScript fundamentals: types, interfaces, generics, decorators, async/await'),
  bullet('Node.js basics: event loop, modules (CommonJS vs ESM), streams, http module'),
  bullet('HTTP protocol: request/response cycle, methods (GET POST PUT PATCH DELETE), status codes'),
  bullet('REST API design: endpoints, resource naming conventions, versioning'),
  bullet('NestJS architecture: modules, controllers, providers/services, dependency injection'),
  bullet('Project scaffolding with the Nest CLI'),
  spacer(),
  h2('Phase 2 — Data & Persistence (Weeks 4–6)'),
  bullet('Relational database fundamentals: tables, rows, primary keys, foreign keys, indexes'),
  bullet('PostgreSQL: installation, psql CLI, pgAdmin, basic SQL (SELECT INSERT UPDATE DELETE)'),
  bullet('TypeORM: entities, repositories, relations (OneToMany, ManyToMany), migrations'),
  bullet('Prisma ORM (alternative): schema, migrations, Prisma Client, seeding'),
  bullet('CRUD patterns: building complete Create-Read-Update-Delete flows end-to-end'),
  bullet('Data validation: class-validator, class-transformer, ValidationPipe'),
  spacer(),
  h2('Phase 3 — Security & Auth (Weeks 7–8)'),
  bullet('Authentication vs Authorization concepts'),
  bullet('JWT (JSON Web Tokens): structure, signing, verifying, expiry, refresh tokens'),
  bullet('Passport.js with NestJS: strategies (Local, JWT)'),
  bullet('Role-based access control (RBAC) with Guards and Decorators'),
  bullet('Hashing passwords with bcrypt'),
  bullet('Protecting routes: AuthGuard, RolesGuard'),
  spacer(),
  h2('Phase 4 — Advanced NestJS (Weeks 9–10)'),
  bullet('Interceptors: transform responses, logging, caching'),
  bullet('Exception filters: custom error handling, global filters'),
  bullet('Pipes: custom validation pipes, ParseIntPipe, ParseUUIDPipe'),
  bullet('Guards: custom guards, metadata with SetMetadata'),
  bullet('Middleware: logging, rate limiting, CORS'),
  bullet('Config module: environment variables with @nestjs/config and .env files'),
  bullet('File uploads with Multer'),
  bullet('Pagination, filtering, and sorting patterns'),
  spacer(),
  h2('Phase 5 — Testing (Weeks 11–12)'),
  bullet('Unit testing with Jest: describe/it/expect, mocking services and repositories'),
  bullet('Integration testing with Supertest: testing HTTP endpoints'),
  bullet('E2E (end-to-end) testing with Nest\'s testing module'),
  bullet('Test coverage reports'),
  bullet('Postman: collections, environments, variables, automated tests with scripts'),
  bullet('Postman Newman: running collections in CI pipelines'),
  spacer(),
  divider(),
);

// ── Section 4: 12-Week Sprint Plan ────────────────────────────
children.push(
  h1('4. 12-Week Sprint Roadmap'),
  body('Each week is a focused sprint. Treat these like work sprints — start Monday, review Friday, reflect on the weekend. Aim for 2–3 hours of focused learning per day.'),
  spacer(),
);

const sprints = [
  {
    week: 1, title: 'TypeScript Bootcamp',
    topics: [
      'TS vs JS — why types matter',
      'Primitive types, arrays, tuples, enums',
      'Interfaces vs Type aliases',
      'Functions: overloads, optional params',
      'Classes, access modifiers',
      'Generics basics',
      'tsconfig.json explained',
    ],
    resources: [
      'TypeScript Handbook (official)',
      'Total TypeScript — Matt Pocock (free)',
      'Execute Program — TypeScript track',
    ],
    goal: 'Build a typed CLI task manager',
  },
  {
    week: 2, title: 'Node.js & HTTP Foundations',
    topics: [
      'Node.js event loop & non-blocking I/O',
      'Built-in modules: fs, path, http',
      'npm: package.json, scripts, devDeps',
      'HTTP verbs, status codes, headers',
      'Build a raw HTTP server (no framework)',
      'Intro to Express (context only)',
    ],
    resources: [
      'Node.js official docs (nodejs.org)',
      'The Odin Project — NodeJS path',
      'MDN HTTP overview',
    ],
    goal: 'Raw Node HTTP server returning JSON',
  },
  {
    week: 3, title: 'NestJS Core Architecture',
    topics: [
      'NestJS philosophy & module system',
      'Modules, Controllers, Services',
      'Dependency Injection (DI) explained',
      'Decorators: @Get @Post @Body @Param',
      'DTOs (Data Transfer Objects)',
      'First CRUD API: /users endpoints',
      'Nest CLI commands',
    ],
    resources: [
      'NestJS official docs (docs.nestjs.com)',
      'NestJS Fundamentals — Udemy (Kamil)',
      'NestJS crash course — YouTube Academind',
    ],
    goal: 'Users CRUD API with in-memory store',
  },
  {
    week: 4, title: 'PostgreSQL & SQL Foundations',
    topics: [
      'Relational model: tables, keys, relations',
      'Install PostgreSQL & psql CLI',
      'Core SQL: SELECT WHERE ORDER JOIN',
      'Aggregate functions: COUNT SUM AVG',
      'Indexes: why and when to use them',
      'pgAdmin / TablePlus GUI tour',
    ],
    resources: [
      'PostgreSQL Tutorial (postgresqltutorial.com)',
      'Mode SQL Tutorial (mode.com/sql-tutorial)',
      'SQLZoo (interactive)',
    ],
    goal: 'Design and query a school DB schema',
  },
  {
    week: 5, title: 'TypeORM + NestJS Integration',
    topics: [
      'TypeORM: entities, columns, decorators',
      '@nestjs/typeorm setup & config',
      'Repositories pattern',
      'Migrations: generate & run',
      'Relations: OneToOne OneToMany ManyToMany',
      'Eager vs lazy loading',
    ],
    resources: [
      'TypeORM official docs (typeorm.io)',
      'NestJS DB chapter (docs.nestjs.com)',
      'Ben Awad — TypeORM series (YouTube)',
    ],
    goal: 'Connect Users API to real PostgreSQL DB',
  },
  {
    week: 6, title: 'Full CRUD App + Validation',
    topics: [
      'Build a Blog API (posts + users)',
      'class-validator decorators',
      'class-transformer: plainToInstance',
      'Global ValidationPipe setup',
      'Error response standardization',
      'Pagination & filtering query params',
      'Intro to Prisma (compare to TypeORM)',
    ],
    resources: [
      'class-validator docs (GitHub)',
      'Prisma docs (prisma.io/docs)',
      'NestJS — Validation chapter',
    ],
    goal: 'Full Blog API with validation',
  },
  {
    week: 7, title: 'Authentication with JWT',
    topics: [
      'Auth concepts: session vs token based',
      'JWT: header.payload.signature deep dive',
      'Passport.js: strategies overview',
      'NestJS @nestjs/passport & @nestjs/jwt',
      'Local strategy (username + password login)',
      'JWT strategy (protect routes)',
      'bcrypt for password hashing',
    ],
    resources: [
      'NestJS Authentication chapter (official)',
      'JWT.io — debugger & docs',
      'Passport.js docs (passportjs.org)',
    ],
    goal: 'Register / Login + protected routes',
  },
  {
    week: 8, title: 'Authorization & RBAC',
    topics: [
      'AuthGuard vs custom Guards',
      'Roles: USER, ADMIN, MODERATOR',
      'SetMetadata + Reflector pattern',
      'Custom RolesGuard',
      'Route-level vs global guards',
      'Refresh token flow',
      'Logout & token blacklisting',
    ],
    resources: [
      'NestJS Authorization chapter (official)',
      'OWASP Auth Cheat Sheet',
      'Auth0 Blog: refresh token rotation',
    ],
    goal: 'Admin-only routes in Blog API',
  },
  {
    week: 9, title: 'Advanced NestJS Patterns',
    topics: [
      'Exception Filters: custom error shapes',
      'Interceptors: ResponseTransformInterceptor',
      'Pipes: custom ParseUUIDPipe',
      'Config module + .env validation (Joi/Zod)',
      'File uploads with Multer',
      'Swagger / OpenAPI with @nestjs/swagger',
    ],
    resources: [
      'NestJS — Exception Filters chapter',
      'NestJS — Interceptors chapter',
      '@nestjs/swagger README (GitHub)',
    ],
    goal: 'Auto-generated Swagger docs for Blog API',
  },
  {
    week: 10, title: 'Performance & Best Practices',
    topics: [
      'Caching with @nestjs/cache-manager (Redis)',
      'Rate limiting: @nestjs/throttler',
      'Database query optimization & indexes',
      'Compression & response size',
      'Logging with Winston / Pino',
      'Health checks: @nestjs/terminus',
      'Environment-based config (dev/prod/test)',
    ],
    resources: [
      'NestJS Caching chapter (official)',
      'Redis docs (redis.io)',
      'Pino logger docs',
    ],
    goal: 'Add caching + rate limiting to API',
  },
  {
    week: 11, title: 'Testing — Unit & Integration',
    topics: [
      'Jest fundamentals: describe it expect',
      'Mocking: jest.fn() jest.spyOn()',
      'Unit test: service layer (mock repos)',
      'Unit test: controller layer',
      'Supertest: HTTP integration tests',
      'Test DB setup with in-memory SQLite / TestContainers',
      'Coverage reports: --coverage flag',
    ],
    resources: [
      'Jest official docs (jestjs.io)',
      'NestJS Testing chapter (official)',
      'Supertest README (GitHub)',
    ],
    goal: '80%+ coverage on Blog API',
  },
  {
    week: 12, title: 'Postman, E2E & Deployment',
    topics: [
      'Postman: collections, environments, variables',
      'Postman: pre-request scripts & test scripts',
      'Newman: run collections from CLI',
      'NestJS E2E test suite',
      'Docker basics: Dockerfile for NestJS',
      'Docker Compose: app + PostgreSQL',
      'Deploy to Railway / Render (free tier)',
    ],
    resources: [
      'Postman Learning Center (learning.postman.com)',
      'Newman docs (GitHub)',
      'Docker Getting Started (docs.docker.com)',
    ],
    goal: 'Blog API live & tested end-to-end',
  },
];

children.push(sprintTable(sprints), spacer(), divider());

// ── Section 5: 2-Week Daily Plan ──────────────────────────────
children.push(
  h1('5. 12-Week Daily Study Plan — Complete Day-by-Day Schedule'),
  body('This is the full daily breakdown for all 12 weeks of the roadmap. Every single day has a morning theory session and an evening hands-on coding session. Follow this and you will never wonder "what should I work on today?" — just open this document and execute.'),
  spacer(),
  infoBox('Daily Time Commitment',
    'Morning: 1.5–2 hours (theory + reading)  |  Evening: 1.5–2 hours (coding practice)  |  Total: ~3–4 hours/day. Weekends are flex days — use them to catch up, review, or work on your mini-project.',
    COLORS.lightAmber, COLORS.accent),
  spacer(),
  h2('Week 1 — TypeScript Foundations'),
);

const week1Days = [
  {
    day: 'Mon Day 1', time: '~3.5 hrs',
    morning: [
      'Read: TS Handbook — Basic Types chapter',
      'Understand: string, number, boolean, any, unknown, never',
      'Configure: tsconfig.json from scratch',
    ],
    evening: [
      'Exercise: annotate 10 JS functions with TS types',
      'Build: a typed "to-do item" interface',
      'Commit your work to a GitHub repo',
    ],
  },
  {
    day: 'Tue Day 2', time: '~3.5 hrs',
    morning: [
      'Read: TS Handbook — Interfaces & Types',
      'Understand: interface vs type alias, extends',
      'Watch: Matt Pocock — interfaces vs types (15 min)',
    ],
    evening: [
      'Exercise: model a User, Post, Comment interface',
      'Build: a function that accepts a User and returns a string',
      'Use type guards (typeof, instanceof)',
    ],
  },
  {
    day: 'Wed Day 3', time: '~3.5 hrs',
    morning: [
      'Read: TS Handbook — Functions chapter',
      'Learn: overloads, rest params, optional params',
      'Read: TS Handbook — Classes chapter',
    ],
    evening: [
      'Exercise: build a BankAccount class with TS',
      'Add: deposit(), withdraw(), getBalance() methods',
      'Use: private, public, readonly modifiers',
    ],
  },
  {
    day: 'Thu Day 4', time: '~3.5 hrs',
    morning: [
      'Read: TS Handbook — Generics chapter',
      'Understand: T extends, generic constraints',
      'Study: Array<T>, Promise<T> in real code',
    ],
    evening: [
      'Build: a generic Stack<T> class',
      'Build: a generic ApiResponse<T> wrapper',
      'Practice: generic utility types (Partial, Required, Pick)',
    ],
  },
  {
    day: 'Fri Day 5', time: '~3.5 hrs',
    morning: [
      'Read: TS Handbook — Decorators (experimental)',
      'Understand: class decorators, method decorators',
      'Preview: how NestJS uses decorators',
    ],
    evening: [
      'Build: a simple @Log() method decorator',
      'Build: a @Readonly class decorator',
      'Start Day 1 mini-project: typed CLI task manager',
    ],
  },
  {
    day: 'Sat Day 6', time: 'Flex',
    morning: [
      'Review all 5 days of notes',
      'Re-read anything that felt unclear',
      'Skim: TypeScript Deep Dive (gitbook) chapter 1',
    ],
    evening: [
      'Complete the CLI task manager project',
      'Add: CRUD (add/list/complete/delete tasks)',
      'Push to GitHub with a README',
    ],
  },
  {
    day: 'Sun Day 7', time: 'Flex',
    morning: [
      'Take the TypeScript Quiz on Execute Program',
      'Read: tsconfig strict mode flags explained',
    ],
    evening: [
      'Refactor task manager with strict: true',
      'Fix all type errors from strict mode',
      'Write a short reflection: 3 things learned',
    ],
  },
];

children.push(dailyTable(week1Days), spacer(), h2('Week 2 — Node.js & HTTP Fundamentals'));

const week2Days = [
  {
    day: 'Mon Day 8', time: '~3.5 hrs',
    morning: [
      'Read: Node.js docs — "About Node.js" + Event Loop',
      'Understand: single thread, libuv, callbacks',
      'Watch: Philip Roberts — "What the heck is the event loop?" (YouTube)',
    ],
    evening: [
      'Practice: write async code with callbacks',
      'Convert to Promises, then async/await',
      'Exercise: read a file, parse JSON, log result',
    ],
  },
  {
    day: 'Tue Day 9', time: '~3.5 hrs',
    morning: [
      'Read: Node.js — built-in modules (fs, path, os)',
      'Understand: CommonJS require() vs ESM import',
      'Study: module.exports patterns',
    ],
    evening: [
      'Build: a file organizer script using fs & path',
      'Practice: read directory, filter .ts files',
      'Experiment with process.env and process.argv',
    ],
  },
  {
    day: 'Wed Day 10', time: '~3.5 hrs',
    morning: [
      'Read: MDN HTTP overview (methods, codes, headers)',
      'Understand: GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Learn: 2xx 3xx 4xx 5xx status code families',
    ],
    evening: [
      'Build: a raw Node.js http.createServer() server',
      'Handle: GET /health returning {"status":"ok"}',
      'Handle: POST /echo returning the request body',
    ],
  },
  {
    day: 'Thu Day 11', time: '~3.5 hrs',
    morning: [
      'Read: npm — package.json structure, scripts',
      'Understand: dependencies vs devDependencies',
      'Study: semantic versioning (^1.2.3 vs ~1.2.3)',
    ],
    evening: [
      'Initialise: npm project with TypeScript + ts-node-dev',
      'Configure: tsconfig.json + nodemon/ts-node-dev',
      'Script: "dev": "ts-node-dev --respawn src/index.ts"',
    ],
  },
  {
    day: 'Fri Day 12', time: '~3.5 hrs',
    morning: [
      'Read: REST API Design fundamentals (restfulapi.net)',
      'Understand: resource naming (/users vs /getUsers)',
      'Study: statelessness, uniform interface',
    ],
    evening: [
      'Postman: install + tour the interface',
      'Create: a collection "My Raw Node Server"',
      'Test: GET /health and POST /echo with Postman',
    ],
  },
  {
    day: 'Sat Day 13', time: 'Flex',
    morning: [
      'Read: intro to Express.js (expressjs.com)',
      'Understand: routing, middleware, req/res',
      'Compare Express architecture to raw Node',
    ],
    evening: [
      'Build: a simple Express app with 3 routes',
      'Add: a logger middleware',
      'Test all routes in Postman',
    ],
  },
  {
    day: 'Sun Day 14', time: 'Flex',
    morning: [
      'Review Weeks 1 & 2 — all notes',
      'Read: NestJS intro — what problem does it solve?',
      'Preview: Week 3 sprint plan',
    ],
    evening: [
      'Scaffold: nest new blog-api',
      'Explore: generated folder structure',
      'Run: npm run start:dev and visit localhost:3000',
    ],
  },
];

children.push(dailyTable(week2Days), spacer(), divider());

// ── Week 3 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 3 — NestJS Core Architecture'),
  infoBox('Week 3 Goal',
    'Scaffold a real NestJS project, understand its module system inside-out, and build your first working CRUD API for /users with in-memory data — no database yet.',
    COLORS.light, COLORS.primary),
  spacer(),
);

const week3Days = [
  {
    day: 'Mon Day 15', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Overview > Introduction + Controllers',
      'Understand: why NestJS exists vs raw Express',
      'Study: @Module(), @Controller(), @Injectable() decorators',
    ],
    evening: [
      'Run: nest new blog-api (if not done Sunday)',
      'Explore: src/ — app.module.ts, app.controller.ts, app.service.ts',
      'Exercise: add a GET /hello route returning { message: "Hello World" }',
    ],
  },
  {
    day: 'Tue Day 16', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Providers & Dependency Injection',
      'Understand: how NestJS resolves service dependencies at runtime',
      'Study: constructor injection pattern',
    ],
    evening: [
      'Generate: nest g module users',
      'Generate: nest g controller users',
      'Generate: nest g service users',
      'Wire them together in UsersModule',
    ],
  },
  {
    day: 'Wed Day 17', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Controllers (route params, query, body)',
      'Study: @Param() @Query() @Body() decorators in depth',
      'Learn: @HttpCode() and @Header() decorators',
    ],
    evening: [
      'Build: GET /users — return array of users',
      'Build: GET /users/:id — return one user by id',
      'Build: POST /users — accept body, push to array',
      'Test all routes in Postman',
    ],
  },
  {
    day: 'Thu Day 18', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — DTOs + class-validator basics',
      'Understand: why DTOs are critical for type safety',
      'Study: @IsString() @IsEmail() @IsNotEmpty() decorators',
    ],
    evening: [
      'Create: CreateUserDto with name, email, password fields',
      'Install: npm i class-validator class-transformer',
      'Enable: app.useGlobalPipes(new ValidationPipe()) in main.ts',
      'Test: send bad data to POST /users — confirm 400 response',
    ],
  },
  {
    day: 'Fri Day 19', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Exception handling (HttpException)',
      'Study: NotFoundException, BadRequestException built-ins',
      'Learn: how NestJS formats error responses by default',
    ],
    evening: [
      'Build: PATCH /users/:id — update a user by id',
      'Build: DELETE /users/:id — remove from array',
      'Add: throw NotFoundException if user id not found',
      'Create: UpdateUserDto using PartialType(CreateUserDto)',
    ],
  },
  {
    day: 'Sat Day 20', time: 'Flex',
    morning: [
      'Read: NestJS docs — Modules (feature modules, shared modules)',
      'Understand: how to export a service from one module and use it in another',
      'Study: global modules with @Global()',
    ],
    evening: [
      'Refactor blog-api: add a PostsModule (scaffold only)',
      'Import UsersModule into PostsModule',
      'Push everything to GitHub with clear commit messages',
    ],
  },
  {
    day: 'Sun Day 21', time: 'Flex',
    morning: [
      'Review Week 3 — re-read your NestJS notes',
      'Read: NestJS CLI reference (nest g --help)',
      'Preview: Week 4 — PostgreSQL & SQL',
    ],
    evening: [
      'Challenge: add a GET /users?name=John filter by query param',
      'Challenge: add response shape { data: [], total: number }',
      'Reflection: write 3 things that confused you and look them up',
    ],
  },
];

children.push(dailyTable(week3Days), spacer(), divider());

// ── Week 4 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 4 — PostgreSQL & SQL Foundations'),
  infoBox('Week 4 Goal',
    'Install PostgreSQL, learn core SQL fluently, design a proper relational schema for your Blog API, and get comfortable querying data in both psql CLI and a GUI tool.',
    COLORS.lightGreen, COLORS.secondary),
  spacer(),
);

const week4Days = [
  {
    day: 'Mon Day 22', time: '~3.5 hrs',
    morning: [
      'Install: PostgreSQL v15+ from postgresql.org/download',
      'Read: PostgreSQL Tutorial — Introduction section',
      'Learn: what a relational database is vs a NoSQL store',
    ],
    evening: [
      'Open psql CLI: psql -U postgres',
      'Run: CREATE DATABASE blog_dev;',
      'Run: \\c blog_dev — connect to it',
      'Run: \\l, \\dt — explore meta commands',
    ],
  },
  {
    day: 'Tue Day 23', time: '~3.5 hrs',
    morning: [
      'Read: PostgreSQL Tutorial — CREATE TABLE + Data Types',
      'Learn: VARCHAR, TEXT, INTEGER, BOOLEAN, TIMESTAMP, UUID',
      'Study: PRIMARY KEY, NOT NULL, UNIQUE constraints',
    ],
    evening: [
      'Create: users table (id UUID, name, email, password, created_at)',
      'Create: posts table (id UUID, title, content, author_id FK, created_at)',
      'INSERT 3 sample users and 5 sample posts manually',
    ],
  },
  {
    day: 'Wed Day 24', time: '~3.5 hrs',
    morning: [
      'Read: PostgreSQL Tutorial — SELECT + WHERE + ORDER BY + LIMIT',
      'Study: AND OR IN BETWEEN LIKE operators',
      'Learn: aliasing columns with AS',
    ],
    evening: [
      'Practice: SELECT all posts by a specific user (WHERE author_id = ...)',
      'Practice: SELECT posts ordered by created_at DESC LIMIT 10',
      'Practice: SELECT users WHERE email LIKE "%@gmail.com"',
      'Try: COUNT(*) — how many posts does each user have?',
    ],
  },
  {
    day: 'Thu Day 25', time: '~3.5 hrs',
    morning: [
      'Read: PostgreSQL Tutorial — JOINs (INNER, LEFT, RIGHT)',
      'Understand: how foreign keys link tables together',
      'Study: when to use INNER vs LEFT JOIN',
    ],
    evening: [
      'Write: JOIN query — posts with their author name',
      'Write: LEFT JOIN — users with their post count (even 0 posts)',
      'Install: TablePlus or DBeaver — connect to blog_dev',
      'Explore your tables visually in the GUI',
    ],
  },
  {
    day: 'Fri Day 26', time: '~3.5 hrs',
    morning: [
      'Read: PostgreSQL Tutorial — UPDATE, DELETE, UPSERT',
      'Learn: transactions: BEGIN, COMMIT, ROLLBACK',
      'Study: indexes — why they matter for query performance',
    ],
    evening: [
      'Practice: UPDATE a user email, UPDATE post content',
      'Practice: DELETE a post, then ROLLBACK in a transaction',
      'Create: an index on posts.author_id',
      'Run: EXPLAIN ANALYZE on a query — read the output',
    ],
  },
  {
    day: 'Sat Day 27', time: 'Flex',
    morning: [
      'Read: PostgreSQL Tutorial — Aggregate Functions (COUNT SUM AVG MIN MAX)',
      'Study: GROUP BY and HAVING clauses',
      'Learn: subqueries basics',
    ],
    evening: [
      'Challenge: query posts per user using GROUP BY',
      'Challenge: find users who have more than 2 posts (HAVING)',
      'Write the Blog API schema as a SQL file — schema.sql',
    ],
  },
  {
    day: 'Sun Day 28', time: 'Flex',
    morning: [
      'Review Week 4 — all SQL queries you wrote',
      'SQLZoo — complete "SELECT basics" + "SELECT from WORLD" exercises',
      'Preview: Week 5 — TypeORM integration with NestJS',
    ],
    evening: [
      'Read: TypeORM docs — Introduction page',
      'Understand: what an ORM does vs raw SQL',
      'Push schema.sql to your GitHub repo',
    ],
  },
];

children.push(dailyTable(week4Days), spacer(), divider());

// ── Week 5 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 5 — TypeORM + NestJS Integration'),
  infoBox('Week 5 Goal',
    'Connect your NestJS blog-api to a real PostgreSQL database using TypeORM. By Friday your Users and Posts endpoints will be reading from and writing to actual database tables — not an array.',
    COLORS.lightAmber, COLORS.accent),
  spacer(),
);

const week5Days = [
  {
    day: 'Mon Day 29', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Database chapter (TypeORM integration)',
      'Install: npm i @nestjs/typeorm typeorm pg',
      'Study: TypeOrmModule.forRoot() configuration options',
    ],
    evening: [
      'Configure: TypeOrmModule.forRoot() in AppModule with blog_dev DB',
      'Set: synchronize: true for development only',
      'Test: npm run start:dev — confirm DB connection in logs',
    ],
  },
  {
    day: 'Tue Day 30', time: '~3.5 hrs',
    morning: [
      'Read: TypeORM docs — Entities',
      'Study: @Entity() @Column() @PrimaryGeneratedColumn("uuid")',
      'Learn: @CreateDateColumn() @UpdateDateColumn() auto-fields',
    ],
    evening: [
      'Create: User entity — id, name, email, password, createdAt',
      'Create: Post entity — id, title, content, createdAt',
      'Register both entities in TypeOrmModule and their feature modules',
      'Verify: tables are auto-created in blog_dev (check TablePlus)',
    ],
  },
  {
    day: 'Wed Day 31', time: '~3.5 hrs',
    morning: [
      'Read: TypeORM docs — Repository pattern',
      'Study: @InjectRepository() decorator in NestJS',
      'Learn: repository methods: find() findOne() save() delete()',
    ],
    evening: [
      'Refactor UsersService: inject Repository<User>',
      'Replace in-memory array with real DB calls',
      'Implement: findAll() findOne(id) create(dto) remove(id)',
      'Test all /users endpoints in Postman against real DB',
    ],
  },
  {
    day: 'Thu Day 32', time: '~3.5 hrs',
    morning: [
      'Read: TypeORM docs — Relations (@OneToMany / @ManyToOne)',
      'Understand: how foreign keys map to TypeORM relation decorators',
      'Study: cascade options, eager vs lazy loading',
    ],
    evening: [
      'Add: @OneToMany(() => Post, post => post.user) to User entity',
      'Add: @ManyToOne(() => User, user => user.posts) to Post entity',
      'Update PostsService to associate posts with a user on creation',
      'Test: create a post with a valid userId, confirm FK in DB',
    ],
  },
  {
    day: 'Fri Day 33', time: '~3.5 hrs',
    morning: [
      'Read: TypeORM docs — Migrations',
      'Understand: why synchronize:true is dangerous in production',
      'Study: generate and run migration commands',
    ],
    evening: [
      'Set: synchronize: false in TypeOrmModule config',
      'Generate: npm run typeorm migration:generate -- -n InitSchema',
      'Run: npm run typeorm migration:run',
      'Confirm: __migrations table exists in blog_dev',
    ],
  },
  {
    day: 'Sat Day 34', time: 'Flex',
    morning: [
      'Read: TypeORM docs — QueryBuilder basics',
      'Study: when to use QueryBuilder vs repository methods',
      'Learn: .where() .andWhere() .leftJoinAndSelect()',
    ],
    evening: [
      'Build: GET /posts — return posts with their author (user) via relation',
      'Build: GET /users/:id/posts — all posts by a specific user',
      'Test both endpoints in Postman, verify nested author object',
    ],
  },
  {
    day: 'Sun Day 35', time: 'Flex',
    morning: [
      'Review Week 5 — all entity + relation code',
      'Read: Prisma docs Introduction (compare approach to TypeORM)',
      'Preview: Week 6 — validation, pagination, full CRUD',
    ],
    evening: [
      'Refactor: add DTOs for PostsModule (CreatePostDto, UpdatePostDto)',
      'Push all changes to GitHub',
      'Write a README section: "Database Setup" with migration steps',
    ],
  },
];

children.push(dailyTable(week5Days), spacer(), divider());

// ── Week 6 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 6 — Full CRUD App + Validation + Pagination'),
  infoBox('Week 6 Goal',
    'Complete the Blog API with rock-solid validation on every endpoint, standardised error responses, and pagination/filtering on list routes. By Sunday you have a production-quality CRUD API to build auth on top of next week.',
    COLORS.light, COLORS.primary),
  spacer(),
);

const week6Days = [
  {
    day: 'Mon Day 36', time: '~3.5 hrs',
    morning: [
      'Read: class-validator docs — full decorator list',
      'Study: @IsString @IsEmail @IsUUID @IsOptional @MinLength @MaxLength',
      'Read: NestJS docs — Validation (ValidationPipe options)',
    ],
    evening: [
      'Harden CreateUserDto: @IsEmail(), @MinLength(8) on password',
      'Harden CreatePostDto: @IsString() @IsNotEmpty() @IsUUID() on userId',
      'Set ValidationPipe options: { whitelist: true, forbidNonWhitelisted: true }',
      'Test: send extra fields in body — confirm they are stripped',
    ],
  },
  {
    day: 'Tue Day 37', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Exception Filters',
      'Study: HttpExceptionFilter — customise the error response shape',
      'Learn: @UseFilters() vs useGlobalFilters()',
    ],
    evening: [
      'Build: HttpExceptionFilter returning { statusCode, message, timestamp, path }',
      'Register it globally in main.ts',
      'Test: trigger a 404 and 400 — verify consistent error shape in Postman',
      'Add: ConflictException when creating a user with duplicate email',
    ],
  },
  {
    day: 'Wed Day 38', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Interceptors (ResponseTransformInterceptor pattern)',
      'Study: how to wrap all success responses in { data, statusCode }',
      'Learn: NestJS lifecycle hooks order (guards → interceptors → pipes → handler)',
    ],
    evening: [
      'Build: TransformInterceptor — wrap all responses in { data: T, statusCode: number }',
      'Register globally with useGlobalInterceptors()',
      'Test: all endpoints now return wrapped response — update Postman tests',
    ],
  },
  {
    day: 'Thu Day 39', time: '~3.5 hrs',
    morning: [
      'Read: common REST pagination patterns (offset vs cursor)',
      'Study: TypeORM .skip() .take() for offset pagination',
      'Learn: query param parsing with ParseIntPipe',
    ],
    evening: [
      'Build: GET /posts?page=1&limit=10 with offset pagination',
      'Return: { data: Post[], total: number, page: number, lastPage: number }',
      'Test in Postman: page 1 vs page 2 with limit 5',
      'Add: GET /posts?search=typescript — filter posts by title keyword',
    ],
  },
  {
    day: 'Fri Day 40', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Pipes (custom pipes)',
      'Study: ParseUUIDPipe — validate route params are valid UUIDs',
      'Learn: building a custom ParsePositiveIntPipe',
    ],
    evening: [
      'Apply: ParseUUIDPipe to all /:id params across users and posts routes',
      'Build: custom ParsePositiveIntPipe for page and limit query params',
      'Test: send invalid UUID as id — confirm 400 with clear message',
    ],
  },
  {
    day: 'Sat Day 41', time: 'Flex',
    morning: [
      'Read: NestJS docs — Middleware',
      'Study: LoggerMiddleware — log every incoming request',
      'Learn: applying middleware globally vs per-module (configure())',
    ],
    evening: [
      'Build: LoggerMiddleware logging method, URL, status, duration',
      'Apply globally in AppModule.configure()',
      'Challenge: add GET /posts?sortBy=createdAt&order=DESC sorting support',
    ],
  },
  {
    day: 'Sun Day 42', time: 'Flex',
    morning: [
      'Full Blog API review — test every endpoint in Postman from scratch',
      'Read: Prisma docs — Quickstart (just reading, no coding yet)',
      'Preview: Week 7 — JWT Authentication',
    ],
    evening: [
      'Clean up: remove all console.log debug statements',
      'Push final Week 6 state to GitHub with a descriptive commit',
      'Update README: list all endpoints with their method, URL, and body shape',
    ],
  },
];

children.push(dailyTable(week6Days), spacer(), divider());

// ── Week 7 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 7 — Authentication with JWT'),
  infoBox('Week 7 Goal',
    'Implement a full register/login flow with hashed passwords, JWT access tokens, and protected routes using Passport.js strategies. By Friday no one can hit a protected endpoint without a valid token.',
    COLORS.light, COLORS.primary),
  spacer(),
);

const week7Days = [
  {
    day: 'Mon Day 43', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Authentication chapter (full page)',
      'Understand: session-based vs token-based auth and why JWTs are stateless',
      'Study: JWT structure — header.payload.signature explained',
      'Visit: jwt.io — paste a token and read the decoded payload',
    ],
    evening: [
      'Install: npm i @nestjs/passport passport passport-local @nestjs/jwt passport-jwt',
      'Install types: npm i -D @types/passport-local @types/passport-jwt',
      'Generate: nest g module auth && nest g service auth && nest g controller auth',
      'Scaffold: AuthModule — import PassportModule and JwtModule',
    ],
  },
  {
    day: 'Tue Day 44', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Implementing Passport local strategy',
      'Study: ValidateUser() method — the heart of local auth',
      'Learn: how Passport calls validate() and what it expects returned',
    ],
    evening: [
      'Install: npm i bcrypt && npm i -D @types/bcrypt',
      'Update UsersService: hash password with bcrypt.hash() on register',
      'Build: LocalStrategy — call usersService.findByEmail() and bcrypt.compare()',
      'Build: POST /auth/register — create user, return sanitised user (no password)',
    ],
  },
  {
    day: 'Wed Day 45', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — JWT strategy and signing tokens',
      'Study: JwtModule.register() options — secret, signOptions: { expiresIn }',
      'Learn: what to put in the JWT payload (userId + role — never password)',
    ],
    evening: [
      'Build: POST /auth/login — validate user via LocalAuthGuard, sign JWT, return token',
      'Configure: JwtModule.register({ secret: process.env.JWT_SECRET, signOptions: { expiresIn: "1d" } })',
      'Build: JwtStrategy — extract Bearer token, verify, return user from payload',
      'Test: POST /auth/login in Postman — copy the returned access_token',
    ],
  },
  {
    day: 'Thu Day 46', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Guards and @UseGuards()',
      'Study: JwtAuthGuard — extending AuthGuard("jwt")',
      'Learn: how to get the current user inside a controller with @Request()',
    ],
    evening: [
      'Build: JwtAuthGuard extending AuthGuard("jwt")',
      'Protect: GET /auth/profile — return req.user from the JWT payload',
      'Protect: DELETE /posts/:id — require valid JWT to delete',
      'Test in Postman: hit protected route without token (401), then with token (200)',
    ],
  },
  {
    day: 'Fri Day 47', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Custom decorators (@CurrentUser)',
      'Study: createParamDecorator — extract data from ExecutionContext',
      'Learn: why custom decorators keep controllers clean',
    ],
    evening: [
      'Build: @CurrentUser() param decorator returning the user from JWT payload',
      'Refactor: replace @Request() req with @CurrentUser() user across controllers',
      'Add: UpdateUserDto — users can only update their own profile (check userId match)',
      'Test: update another user\'s profile — confirm 403 Forbidden response',
    ],
  },
  {
    day: 'Sat Day 48', time: 'Flex',
    morning: [
      'Read: refresh token concepts — why short-lived access tokens need refresh tokens',
      'Study: storing refresh tokens securely (hashed in DB vs Redis)',
      'Read: Auth0 blog — refresh token rotation article',
    ],
    evening: [
      'Implement: POST /auth/refresh — accept refreshToken, return new accessToken',
      'Store: hashed refresh token on the User entity (refreshToken column)',
      'Add: POST /auth/logout — clear refresh token in DB',
      'Test the full register → login → refresh → logout flow in Postman',
    ],
  },
  {
    day: 'Sun Day 49', time: 'Flex',
    morning: [
      'Review Week 7 — re-read all auth code top to bottom',
      'Read: OWASP Authentication Cheat Sheet — skim for best practices',
      'Preview: Week 8 — Roles, Guards, and RBAC',
    ],
    evening: [
      'Security audit: ensure NO passwords are ever returned in any API response',
      'Add: @Exclude() from class-transformer on password field in User entity',
      'Push all Week 7 changes to GitHub',
    ],
  },
];

children.push(dailyTable(week7Days), spacer(), divider());

// ── Week 8 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 8 — Authorization & Role-Based Access Control'),
  infoBox('Week 8 Goal',
    'Implement a clean RBAC system so admins can do everything, and regular users are restricted to their own resources. By Friday the Blog API has a complete permissions layer on every route.',
    COLORS.lightGreen, COLORS.secondary),
  spacer(),
);

const week8Days = [
  {
    day: 'Mon Day 50', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Authorization chapter',
      'Understand: Authentication (who are you?) vs Authorization (what can you do?)',
      'Study: Role enum — USER, ADMIN, MODERATOR and when to use each',
    ],
    evening: [
      'Add: role column to User entity — enum Role { USER = "user", ADMIN = "admin" }',
      'Set: default role to Role.USER in the entity @Column({ default: Role.USER })',
      'Generate migration and run it against blog_dev',
      'Update: register endpoint — accept optional role field (admin-only in real apps)',
    ],
  },
  {
    day: 'Tue Day 51', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Roles Guard using Reflector + SetMetadata',
      'Study: @SetMetadata("roles", [Role.ADMIN]) and how Reflector reads it',
      'Learn: the difference between @UseGuards ordering (JWT first, then Roles)',
    ],
    evening: [
      'Create: roles.decorator.ts — @Roles(...roles: Role[]) using SetMetadata',
      'Build: RolesGuard — inject Reflector, read required roles, compare to req.user.role',
      'Register: RolesGuard globally with APP_GUARD in AppModule providers',
      'Test: decorate an admin-only route — confirm 403 for USER role token',
    ],
  },
  {
    day: 'Wed Day 52', time: '~3.5 hrs',
    morning: [
      'Study: resource ownership pattern — "can this user modify this resource?"',
      'Read: common ownership check approaches (in guard vs in service)',
      'Think through: which Blog API routes need ownership checks',
    ],
    evening: [
      'Implement: PATCH /posts/:id — only the post author or ADMIN can update',
      'Implement: DELETE /posts/:id — only the post author or ADMIN can delete',
      'Implement: PATCH /users/:id — users can only update their own profile',
      'Test all ownership scenarios in Postman with both USER and ADMIN tokens',
    ],
  },
  {
    day: 'Thu Day 53', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Policies / Claims-based auth (PoliciesGuard pattern)',
      'Study: ability-based access control as an alternative to simple roles',
      'Learn: casl library — ability.can(Action.Update, post)',
    ],
    evening: [
      'Install: npm i @casl/ability',
      'Define: AppAbility — Action enum (Manage, Create, Read, Update, Delete)',
      'Build: CaslAbilityFactory — define abilities per role',
      'Apply: @CheckPolicies() decorator on posts update and delete routes',
    ],
  },
  {
    day: 'Fri Day 54', time: '~3.5 hrs',
    morning: [
      'Review: all guards in the project — LocalAuthGuard, JwtAuthGuard, RolesGuard',
      'Study: guard execution order and short-circuiting',
      'Read: public routes pattern — @Public() decorator to skip JWT guard',
    ],
    evening: [
      'Build: @Public() decorator using SetMetadata("isPublic", true)',
      'Update: JwtAuthGuard — check isPublic metadata, skip verification if true',
      'Apply: @Public() to register, login, and GET /posts (read-only is public)',
      'Test: hit GET /posts without any token — confirm 200 response',
    ],
  },
  {
    day: 'Sat Day 55', time: 'Flex',
    morning: [
      'Read: token blacklisting strategies (in-memory set vs Redis vs DB flag)',
      'Study: why logout is hard with stateless JWTs',
      'Read: short-lived tokens + refresh rotation as the recommended solution',
    ],
    evening: [
      'Implement: token version field on User — increment on logout/password change',
      'Update: JwtStrategy.validate() — reject tokens issued before current token version',
      'Test: login, get token, logout, try to use old token — confirm 401',
    ],
  },
  {
    day: 'Sun Day 56', time: 'Flex',
    morning: [
      'Full auth + RBAC review — trace every protected route from request to response',
      'Read: OWASP Top 10 — A01 Broken Access Control (the #1 web vulnerability)',
      'Preview: Week 9 — Advanced NestJS patterns + Swagger',
    ],
    evening: [
      'Write: a Postman test suite specifically for auth (register/login/refresh/logout/forbidden)',
      'Push all Week 8 changes to GitHub',
      'Write README section: "Auth & Authorization" explaining the roles and guards',
    ],
  },
];

children.push(dailyTable(week8Days), spacer(), divider());

// ── Week 9 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 9 — Advanced NestJS Patterns + Swagger Docs'),
  infoBox('Week 9 Goal',
    'Level up the API with production-grade patterns: config management, file uploads, auto-generated Swagger/OpenAPI documentation, and a polished request/response pipeline using interceptors, filters, and pipes.',
    COLORS.lightAmber, COLORS.accent),
  spacer(),
);

const week9Days = [
  {
    day: 'Mon Day 57', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Configuration (@nestjs/config)',
      'Study: ConfigModule.forRoot() — loading .env files',
      'Learn: ConfigService.get<string>("JWT_SECRET") typed access',
    ],
    evening: [
      'Install: npm i @nestjs/config',
      'Create: .env file — DATABASE_URL, JWT_SECRET, JWT_EXPIRES_IN, PORT',
      'Create: .env.example — same keys, empty values (commit this, NOT .env)',
      'Refactor: replace all hardcoded config values with ConfigService.get()',
    ],
  },
  {
    day: 'Tue Day 58', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Configuration validation with Joi',
      'Study: validationSchema in ConfigModule.forRoot() — type-safe env vars',
      'Learn: NODE_ENV — development, production, test environments',
    ],
    evening: [
      'Install: npm i joi',
      'Add: Joi validation schema — require JWT_SECRET min 32 chars, DATABASE_URL string',
      'Test: remove JWT_SECRET from .env — confirm app refuses to start with clear error',
      'Create: config/database.config.ts and config/jwt.config.ts for separation',
    ],
  },
  {
    day: 'Wed Day 59', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — File upload with Multer',
      'Study: FileInterceptor, FilesInterceptor, multer options',
      'Learn: validating file type and size with ParseFilePipe + FileTypeValidator',
    ],
    evening: [
      'Add: thumbnail column (nullable) to Post entity + migration',
      'Build: POST /posts/:id/thumbnail — upload image, save filename to DB',
      'Configure: multer dest, file size limit (2MB), allowed mimetypes (jpeg/png/webp)',
      'Serve: static files — app.useStaticAssets("uploads") in main.ts',
    ],
  },
  {
    day: 'Thu Day 60', time: '~3.5 hrs',
    morning: [
      'Read: @nestjs/swagger README + NestJS docs — OpenAPI chapter',
      'Study: @ApiTags() @ApiOperation() @ApiResponse() @ApiBearerAuth()',
      'Learn: SwaggerModule.setup() in main.ts',
    ],
    evening: [
      'Install: npm i @nestjs/swagger',
      'Configure: SwaggerModule in main.ts — title, description, version, bearerAuth',
      'Decorate: all DTOs with @ApiProperty() — add description and example values',
      'Decorate: all controllers with @ApiTags() @ApiOperation() @ApiResponse()',
    ],
  },
  {
    day: 'Fri Day 61', time: '~3.5 hrs',
    morning: [
      'Study: Swagger UI at localhost:3000/api — explore your generated docs',
      'Read: OpenAPI spec — understanding the generated swagger.json',
      'Learn: ApiExtraModels, ApiBody for complex request bodies',
    ],
    evening: [
      'Add: @ApiResponse({ status: 401, description: "Unauthorized" }) to protected routes',
      'Add: @ApiBearerAuth() to all routes using JwtAuthGuard',
      'Test: use "Authorize" button in Swagger UI to test protected endpoints directly',
      'Export: swagger.json — add it to your GitHub repo as API documentation',
    ],
  },
  {
    day: 'Sat Day 62', time: 'Flex',
    morning: [
      'Read: NestJS docs — Serialization (class-transformer + ClassSerializerInterceptor)',
      'Study: @Exclude() @Expose() @Transform() decorators on entities',
      'Learn: how to have different serialization for different roles',
    ],
    evening: [
      'Enable: ClassSerializerInterceptor globally in main.ts',
      'Add: @Exclude() on password field — confirm it never appears in API responses',
      'Build: a UserResponseDto using @Expose() — control exactly what fields are returned',
      'Test: GET /users/:id — confirm password is absent in response',
    ],
  },
  {
    day: 'Sun Day 63', time: 'Flex',
    morning: [
      'Review Week 9 — explore your Swagger UI, read every endpoint documentation',
      'Read: NestJS lifecycle hooks — OnModuleInit, OnApplicationBootstrap',
      'Preview: Week 10 — Caching, rate limiting, logging, performance',
    ],
    evening: [
      'Challenge: add a seeder script — populate DB with 10 fake users and 30 posts on startup',
      'Install: npm i @faker-js/faker — generate realistic names, emails, titles',
      'Push all Week 9 changes to GitHub — link your Swagger URL in the README',
    ],
  },
];

children.push(dailyTable(week9Days), spacer(), divider());

// ── Week 10 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 10 — Performance, Caching & Production Readiness'),
  infoBox('Week 10 Goal',
    'Make the Blog API production-ready: add Redis caching to hot endpoints, rate-limit auth routes, structure professional logging with Winston, add health checks, and harden the app with helmet and CORS configuration.',
    COLORS.light, COLORS.primary),
  spacer(),
);

const week10Days = [
  {
    day: 'Mon Day 64', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Caching (@nestjs/cache-manager)',
      'Understand: why caching matters — reduce DB load on frequently read endpoints',
      'Study: TTL (time-to-live), cache invalidation strategies',
    ],
    evening: [
      'Install: npm i @nestjs/cache-manager cache-manager',
      'Configure: CacheModule.register({ ttl: 60, max: 100 }) in AppModule',
      'Add: @UseInterceptors(CacheInterceptor) to GET /posts — cache the list',
      'Test: hit GET /posts twice — check response time difference in Postman',
    ],
  },
  {
    day: 'Tue Day 65', time: '~3.5 hrs',
    morning: [
      'Read: Redis docs — Introduction + data types overview',
      'Study: how Redis works as an in-memory store with persistence options',
      'Learn: installing Redis locally or using Redis Cloud (free tier)',
    ],
    evening: [
      'Install Redis locally (or use Docker: docker run -p 6379:6379 redis)',
      'Install: npm i cache-manager-redis-yet ioredis',
      'Update: CacheModule to use Redis store instead of in-memory',
      'Test: restart the server — cached data should survive (Redis persistence)',
    ],
  },
  {
    day: 'Wed Day 66', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Rate Limiting (@nestjs/throttler)',
      'Study: ThrottlerModule options — ttl, limit, ignoreUserAgents',
      'Learn: applying different limits to auth vs public routes',
    ],
    evening: [
      'Install: npm i @nestjs/throttler',
      'Configure: ThrottlerModule globally — 100 requests per 60 seconds default',
      'Override: auth routes — stricter limit: 10 login attempts per 60 seconds',
      'Test: hammer POST /auth/login 11 times in Postman — confirm 429 Too Many Requests',
    ],
  },
  {
    day: 'Thu Day 67', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Logger + Winston integration',
      'Study: log levels — error, warn, log, debug, verbose',
      'Learn: structured logging (JSON format) vs unstructured (plain text)',
    ],
    evening: [
      'Install: npm i winston nest-winston',
      'Configure: WinstonModule in AppModule — console transport for dev, file transport for prod',
      'Replace: all console.log() calls with this.logger.log() / this.logger.error()',
      'Add: request logging middleware — log method, URL, status, response time in ms',
    ],
  },
  {
    day: 'Fri Day 68', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Health Checks (@nestjs/terminus)',
      'Study: HealthCheckService, TypeOrmHealthIndicator, HttpHealthIndicator',
      'Learn: why health checks are essential for Docker and load balancers',
    ],
    evening: [
      'Install: npm i @nestjs/terminus',
      'Build: GET /health — check DB connection and disk storage',
      'Install: npm i helmet — add security headers (XSS, clickjacking protection)',
      'Configure: app.use(helmet()) and app.enableCors() with allowedOrigins in main.ts',
    ],
  },
  {
    day: 'Sat Day 69', time: 'Flex',
    morning: [
      'Read: NestJS docs — Compression middleware',
      'Study: gzip compression — reduces response payload size significantly',
      'Read: database query optimisation — N+1 problem in depth with TypeORM',
    ],
    evening: [
      'Install: npm i compression && app.use(compression()) in main.ts',
      'Audit: all TypeORM queries — add .relations or QueryBuilder joins to fix N+1',
      'Add: database indexes on commonly filtered columns (posts.title, users.email)',
      'Run: EXPLAIN ANALYZE on slow queries in psql to verify index usage',
    ],
  },
  {
    day: 'Sun Day 70', time: 'Flex',
    morning: [
      'Review Week 10 — all performance and security additions',
      'Read: 12-Factor App methodology (12factor.net) — understand production best practices',
      'Preview: Week 11 — Unit and integration testing with Jest',
    ],
    evening: [
      'Create: environment-specific configs — src/config/app.config.ts loading NODE_ENV',
      'Test: start app with NODE_ENV=production — confirm prod-only settings activate',
      'Push all Week 10 changes to GitHub with a "performance" tag in the commit message',
    ],
  },
];

children.push(dailyTable(week10Days), spacer(), divider());

// ── Week 11 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 11 — Testing: Unit, Integration & Coverage'),
  infoBox('Week 11 Goal',
    'Build a comprehensive test suite for the Blog API. Unit test every service method with mocked dependencies. Write integration tests that hit real HTTP endpoints. Reach 80%+ code coverage by Sunday.',
    COLORS.lightGreen, COLORS.secondary),
  spacer(),
);

const week11Days = [
  {
    day: 'Mon Day 71', time: '~3.5 hrs',
    morning: [
      'Read: Jest docs — Getting Started + Matchers reference',
      'Study: describe() it() expect() — the three building blocks',
      'Learn: toBe vs toEqual vs toStrictEqual — know the difference',
    ],
    evening: [
      'Explore: NestJS generated *.spec.ts files (app.controller.spec.ts)',
      'Run: npm run test — see the default test pass',
      'Write: 5 pure unit tests for a utility function (e.g., pagination helper)',
      'Run: npm run test:watch — keep tests running as you code',
    ],
  },
  {
    day: 'Tue Day 72', time: '~3.5 hrs',
    morning: [
      'Read: Jest docs — Mock Functions (jest.fn(), jest.spyOn())',
      'Study: mockReturnValue, mockResolvedValue, mockRejectedValue',
      'Learn: why you mock dependencies in unit tests (isolation principle)',
    ],
    evening: [
      'Write: users.service.spec.ts — unit test findAll(), findOne(), create(), remove()',
      'Mock: Repository<User> using jest.fn() for each repository method',
      'Test: findOne() with non-existent id — assert NotFoundException is thrown',
      'Run: npm run test users.service — confirm all tests pass',
    ],
  },
  {
    day: 'Wed Day 73', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — Testing (Test.createTestingModule())',
      'Study: how to create a NestJS testing module with mocked providers',
      'Learn: the difference between unit tests and integration tests in NestJS',
    ],
    evening: [
      'Write: posts.service.spec.ts — test create, findAll with pagination, update, remove',
      'Write: auth.service.spec.ts — test register (hash check), login (bcrypt.compare mock)',
      'Use: Test.createTestingModule({ providers: [...] }) for all service tests',
      'Confirm: all service tests passing before moving to controllers',
    ],
  },
  {
    day: 'Thu Day 74', time: '~3.5 hrs',
    morning: [
      'Read: Supertest README — HTTP assertions for Node.js',
      'Study: request(app.getHttpServer()).get("/path").expect(200)',
      'Learn: how to seed test data and clean up after each test (afterEach/afterAll)',
    ],
    evening: [
      'Write: users.controller.spec.ts — mock UsersService, test GET/POST/PATCH/DELETE',
      'Write: auth.controller.spec.ts — mock AuthService, test register and login',
      'Assert: correct HTTP status codes and response shapes on each controller method',
      'Run: npm run test -- --testPathPattern=controller',
    ],
  },
  {
    day: 'Fri Day 75', time: '~3.5 hrs',
    morning: [
      'Read: NestJS docs — E2E Testing with Supertest',
      'Study: how to spin up the full NestJS app in test mode',
      'Learn: using a separate test database (blog_test) to avoid corrupting dev data',
    ],
    evening: [
      'Create: test/app.e2e-spec.ts — use INestApplication + Supertest',
      'Write E2E test: POST /auth/register → POST /auth/login → GET /auth/profile',
      'Write E2E test: POST /posts (with auth header) → GET /posts → DELETE /posts/:id',
      'Run: npm run test:e2e — fix any failures',
    ],
  },
  {
    day: 'Sat Day 76', time: 'Flex',
    morning: [
      'Run: npm run test:cov — generate coverage report',
      'Read: the coverage/lcov-report/index.html — find uncovered branches',
      'Study: what 80% coverage means and what it does NOT guarantee',
    ],
    evening: [
      'Fill gaps: write tests for any uncovered service methods found in coverage report',
      'Add: tests for edge cases — empty arrays, null values, duplicate emails',
      'Target: reach 80%+ statements and branches coverage across services',
      'Commit: all test files to GitHub',
    ],
  },
  {
    day: 'Sun Day 77', time: 'Flex',
    morning: [
      'Review Week 11 — read all your spec files from top to bottom',
      'Read: test pyramid concept — unit vs integration vs E2E ratio',
      'Preview: Week 12 — Postman automation, Docker, deployment',
    ],
    evening: [
      'Add: a GitHub Actions workflow (.github/workflows/test.yml) that runs npm run test on every push',
      'Confirm: CI passes on GitHub — see the green checkmark on your repo',
      'Push all Week 11 test files to GitHub',
    ],
  },
];

children.push(dailyTable(week11Days), spacer(), divider());

// ── Week 12 Daily Plan ──────────────────────────────────────────
children.push(
  h2('Week 12 — Postman Automation, Docker & Deployment'),
  infoBox('Week 12 Goal',
    'Complete the roadmap with a polished, deployable product: a fully automated Postman test suite, a Dockerised app with Docker Compose, and a live public URL on Railway. This is your portfolio capstone.',
    COLORS.lightAmber, COLORS.accent),
  spacer(),
);

const week12Days = [
  {
    day: 'Mon Day 78', time: '~3.5 hrs',
    morning: [
      'Read: Postman Learning Center — Writing tests + Using variables',
      'Study: pm.test(), pm.expect(), pm.environment.set() in test scripts',
      'Study: pre-request scripts — generating dynamic data before a request fires',
    ],
    evening: [
      'Open Postman — create a new Collection: "Blog API — Full E2E Suite"',
      'Add environments: "Blog API Local" (baseUrl=http://localhost:3000)',
      'Build: Register request + test script that saves userId to environment',
      'Build: Login request + test script that saves access_token to environment',
    ],
  },
  {
    day: 'Tue Day 79', time: '~3.5 hrs',
    morning: [
      'Study: Postman Collection Runner — running requests in sequence',
      'Learn: Postman test assertions — status, body shape, response time',
      'Read: chaining requests — using data from previous response in next request',
    ],
    evening: [
      'Build: Create Post request — use {{token}} Bearer auth, save postId from response',
      'Build: Get Post by ID — use {{postId}} from environment',
      'Build: Update Post — PATCH with partial body, assert 200 + updated fields',
      'Build: Delete Post — DELETE, assert 204, then GET same id to assert 404',
    ],
  },
  {
    day: 'Wed Day 80', time: '~3.5 hrs',
    morning: [
      'Read: Newman docs — CLI runner for Postman collections',
      'Study: newman run options — reporters, environment files, bail on failure',
      'Learn: how to export a Postman collection as JSON',
    ],
    evening: [
      'Export: collection as Blog_API.postman_collection.json',
      'Export: environment as Blog_API_Local.postman_environment.json',
      'Install: npm install -g newman newman-reporter-htmlextra',
      'Run: newman run Blog_API.postman_collection.json -e Blog_API_Local.postman_environment.json --reporters htmlextra',
    ],
  },
  {
    day: 'Thu Day 81', time: '~3.5 hrs',
    morning: [
      'Read: Docker Getting Started guide (docs.docker.com/get-started)',
      'Understand: image vs container, Dockerfile instructions (FROM RUN COPY CMD)',
      'Study: .dockerignore — what to exclude from the build context',
    ],
    evening: [
      'Create: Dockerfile for NestJS app — multi-stage build (builder + runner stages)',
      'Stage 1: FROM node:20-alpine AS builder — install deps, build TypeScript',
      'Stage 2: FROM node:20-alpine — copy dist/ only, run node dist/main',
      'Build: docker build -t blog-api . && docker run -p 3000:3000 blog-api',
    ],
  },
  {
    day: 'Fri Day 82', time: '~3.5 hrs',
    morning: [
      'Read: Docker Compose docs — services, networks, volumes, depends_on',
      'Study: linking the NestJS container to a PostgreSQL container via service name',
      'Learn: environment variable injection in docker-compose.yml',
    ],
    evening: [
      'Create: docker-compose.yml — services: api (your Dockerfile) + db (postgres:15-alpine)',
      'Configure: DATABASE_URL in api service environment to point to db service',
      'Add: volumes for PostgreSQL data persistence',
      'Run: docker compose up — confirm API connects to DB container successfully',
    ],
  },
  {
    day: 'Sat Day 83', time: 'Flex',
    morning: [
      'Read: Railway docs (docs.railway.app) — deploying a NestJS app',
      'Study: Railway environment variables configuration panel',
      'Understand: Railway auto-detects Node.js apps and builds from Dockerfile',
    ],
    evening: [
      'Sign up: Railway (railway.app) — connect your GitHub account',
      'Create: new Railway project — deploy from your blog-api GitHub repo',
      'Add: PostgreSQL plugin in Railway — copy DATABASE_URL to your service env vars',
      'Set: all environment variables (JWT_SECRET, NODE_ENV=production) in Railway dashboard',
    ],
  },
  {
    day: 'Sun Day 84', time: 'Flex — GRADUATION DAY',
    morning: [
      'Deploy: trigger a Railway deployment — watch the build logs',
      'Run: migrations on the production Railway database',
      'Update: Postman environment "Blog API Production" with the live Railway URL',
    ],
    evening: [
      'Run: Newman against the production URL — all tests should pass on the live server',
      'Polish README: add live URL, Swagger link, architecture diagram, local setup steps',
      'Final push: tag the release on GitHub — git tag v1.0.0 && git push --tags',
      'Celebrate — you just built and shipped a production-grade REST API from scratch.',
    ],
  },
];

children.push(dailyTable(week12Days), spacer(), divider());

// ── Section 6: Postman Guide ───────────────────────────────────
children.push(
  h1('6. Postman — Complete Guide for Beginners'),
  body('Postman is the industry-standard tool for developing and testing APIs. You will use it throughout this roadmap. Here is everything you need to know to use it effectively.'),
  spacer(),
  h2('Core Concepts'),
  bullet('Request: a single API call (method + URL + headers + body)'),
  bullet('Collection: a folder of related requests (e.g., "Blog API — Auth")'),
  bullet('Environment: a set of variables like {{baseUrl}}, {{token}} that you can swap between dev/prod'),
  bullet('Variable: a reusable value. Collection variables persist across sessions; environment variables are environment-specific'),
  bullet('Pre-request Script: JavaScript that runs before the request (e.g., generate a timestamp)'),
  bullet('Test Script: JavaScript that runs after the response (e.g., assert status === 200)'),
  spacer(),
  h2('Setting Up Your First Collection'),
  numbered('Open Postman → New → Collection → name it "Blog API"'),
  numbered('Right-click Collection → Add Environment Variable: baseUrl = http://localhost:3000'),
  numbered('Add a folder: "Auth" — put Register and Login requests here'),
  numbered('Add a folder: "Posts" — put CRUD requests here'),
  numbered('In the Login request Tests tab, save the token: pm.environment.set("token", pm.response.json().access_token)'),
  numbered('On protected requests, set Auth: Bearer Token → value: {{token}}'),
  spacer(),
  h2('Writing Test Scripts'),
  new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  // In the Tests tab of any request:', font: 'Courier New', size: 20, color: '#6EE7B7' })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  pm.test("Status is 201", () => {', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '    pm.response.to.have.status(201);', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  });', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  pm.test("Body has id", () => {', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 0 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '    pm.expect(pm.response.json()).to.have.property("id");', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 80 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  });', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  spacer(),
  h2('Running Collections with Newman (CLI)'),
  body('Newman lets you run Postman collections from the terminal — essential for CI pipelines.'),
  new Paragraph({
    spacing: { before: 80, after: 80 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  npm install -g newman', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  new Paragraph({
    spacing: { before: 0, after: 80 },
    shading: { fill: COLORS.headerBg, type: ShadingType.CLEAR },
    children: [new TextRun({ text: '  newman run BlogAPI.postman_collection.json -e dev.postman_environment.json', font: 'Courier New', size: 20, color: COLORS.white })],
  }),
  spacer(),
  divider(),
);

// ── Section 7: VS Code Workflow ────────────────────────────────
children.push(
  h1('7. VS Code Workflow & Shortcuts'),
  body('VS Code is your primary tool. Mastering it saves hours. Below are the most important features and keyboard shortcuts for backend development.'),
  spacer(),
  h2('Essential Keyboard Shortcuts (Windows/Linux)'),
);

const shortcuts = [
  ['Ctrl + P', 'Quick file open by name'],
  ['Ctrl + Shift + P', 'Command palette — run any VS Code command'],
  ['Ctrl + `', 'Open integrated terminal'],
  ['Ctrl + B', 'Toggle sidebar'],
  ['Alt + Click', 'Multi-cursor editing'],
  ['Ctrl + D', 'Select next occurrence of current word'],
  ['F12', 'Go to definition (essential for TS)'],
  ['Alt + F12', 'Peek definition (inline)'],
  ['Shift + F12', 'Find all references'],
  ['Ctrl + Shift + F', 'Search across all files'],
  ['Ctrl + /', 'Toggle comment'],
  ['Ctrl + Shift + K', 'Delete line'],
];

const shortcutCols = [2400, 6960];
children.push(
  new Table({
    width: { size: 9360, type: WidthType.DXA },
    columnWidths: shortcutCols,
    rows: [
      new TableRow({ children: [headerCell('Shortcut', shortcutCols[0]), headerCell('Action', shortcutCols[1])] }),
      ...shortcuts.map((s, i) => new TableRow({
        children: [
          dataCell(s[0], shortcutCols[0], i % 2 === 0 ? COLORS.gray100 : COLORS.white, true, COLORS.primary),
          dataCell(s[1], shortcutCols[1], i % 2 === 0 ? COLORS.gray100 : COLORS.white),
        ]
      }))
    ]
  }),
  spacer(),
  h2('Settings to Configure Immediately'),
  bullet('"editor.formatOnSave": true — Prettier formats every time you save'),
  bullet('"editor.defaultFormatter": "esbenp.prettier-vscode" — set Prettier as default'),
  bullet('"typescript.preferences.importModuleSpecifier": "relative" — consistent imports'),
  bullet('"terminal.integrated.defaultProfile.linux": "bash" — or zsh if you prefer'),
  spacer(),
  infoBox('Pro Tip: Workspace Settings',
    'Create a .vscode/settings.json in each project to keep project-specific settings (like disabling certain linting rules for tests). These settings override your global settings for that workspace only.',
    COLORS.lightGreen, COLORS.secondary),
  spacer(),
  divider(),
);

// ── Section 8: Resource Directory ─────────────────────────────
children.push(
  h1('8. Full Resource Directory'),
  body('All resources are free unless marked (Paid). This is your complete reference library throughout the 12-week roadmap.'),
  spacer(),
);

const resources = [
  { name: 'TypeScript Handbook', type: 'Official Docs', topic: 'TypeScript', url: 'typescriptlang.org/docs/handbook' },
  { name: 'Total TypeScript', type: 'Free Course', topic: 'TypeScript', url: 'totaltypescript.com' },
  { name: 'TypeScript Deep Dive', type: 'Free Book', topic: 'TypeScript', url: 'basarat.gitbook.io/typescript' },
  { name: 'Execute Program', type: 'Interactive', topic: 'TypeScript', url: 'executeprogram.com (limited free)' },
  { name: 'Node.js Docs', type: 'Official Docs', topic: 'Node.js', url: 'nodejs.org/en/docs' },
  { name: 'The Odin Project', type: 'Free Course', topic: 'Node.js / JS', url: 'theodinproject.com/paths' },
  { name: 'NestJS Official Docs', type: 'Official Docs', topic: 'NestJS', url: 'docs.nestjs.com' },
  { name: 'NestJS Zero to Hero', type: 'Paid Course', topic: 'NestJS', url: 'udemy.com (Ariel Weinberger)' },
  { name: 'PostgreSQL Tutorial', type: 'Free Tutorial', topic: 'PostgreSQL', url: 'postgresqltutorial.com' },
  { name: 'Mode SQL Tutorial', type: 'Interactive', topic: 'SQL', url: 'mode.com/sql-tutorial' },
  { name: 'SQLZoo', type: 'Interactive', topic: 'SQL', url: 'sqlzoo.net' },
  { name: 'TypeORM Docs', type: 'Official Docs', topic: 'TypeORM', url: 'typeorm.io' },
  { name: 'Prisma Docs', type: 'Official Docs', topic: 'Prisma ORM', url: 'prisma.io/docs' },
  { name: 'JWT.io', type: 'Reference', topic: 'JWT / Auth', url: 'jwt.io' },
  { name: 'Passport.js Docs', type: 'Official Docs', topic: 'Auth', url: 'passportjs.org' },
  { name: 'OWASP Top 10', type: 'Security Guide', topic: 'Security', url: 'owasp.org/Top10' },
  { name: 'Jest Docs', type: 'Official Docs', topic: 'Testing', url: 'jestjs.io' },
  { name: 'Supertest README', type: 'GitHub', topic: 'Integration Tests', url: 'github.com/ladjs/supertest' },
  { name: 'Postman Learning Center', type: 'Official Guide', topic: 'Postman', url: 'learning.postman.com' },
  { name: 'Newman Docs', type: 'GitHub', topic: 'Postman CLI', url: 'github.com/postmanlabs/newman' },
  { name: 'Swagger / OpenAPI', type: 'Official Docs', topic: '@nestjs/swagger', url: 'swagger.io/docs' },
  { name: 'Docker Getting Started', type: 'Official Docs', topic: 'Docker', url: 'docs.docker.com/get-started' },
  { name: 'MDN HTTP Docs', type: 'Reference', topic: 'HTTP Protocol', url: 'developer.mozilla.org/HTTP' },
  { name: 'restfulapi.net', type: 'Guide', topic: 'REST Design', url: 'restfulapi.net' },
  { name: 'Redis Docs', type: 'Official Docs', topic: 'Caching', url: 'redis.io/docs' },
  { name: 'GitHub (free hosting)', type: 'Tool', topic: 'Version Control', url: 'github.com' },
  { name: 'Railway', type: 'Deployment', topic: 'Hosting (free tier)', url: 'railway.app' },
  { name: 'Render', type: 'Deployment', topic: 'Hosting (free tier)', url: 'render.com' },
];

children.push(resourceTable(resources), spacer(), divider());

// ── Section 9: Project Milestones ─────────────────────────────
children.push(
  h1('9. Capstone Project Milestones'),
  body('You will build one project throughout the roadmap: a Blog API. Each phase adds features. By week 12 it will be a production-grade REST API you can show in your portfolio.'),
  spacer(),
  h2('Blog API — Feature Progression'),
  bullet('Week 3: Basic CRUD for users (in-memory), no database yet'),
  bullet('Week 5: Plug in PostgreSQL + TypeORM — persist users and posts'),
  bullet('Week 6: Add validation, pagination, filtering on all endpoints'),
  bullet('Week 7: Add auth — register, login, JWT tokens, protected routes'),
  bullet('Week 8: Add roles — admin can delete any post, users can only delete their own'),
  bullet('Week 9: Add Swagger docs, file upload for post thumbnails, config module'),
  bullet('Week 10: Add Redis caching on GET /posts, rate limiting on auth routes'),
  bullet('Week 11: Write unit + integration tests — target 80%+ coverage'),
  bullet('Week 12: Postman E2E test suite, Dockerize, deploy to Railway'),
  spacer(),
  infoBox('Portfolio Tip',
    'After week 12, your Blog API README should include: architecture diagram, API documentation (Swagger link), how to run locally (Docker Compose), test instructions, and a live URL. This is what hiring managers look for.',
    COLORS.lightAmber, COLORS.accent),
  spacer(),
  divider(),
);

// ── Section 10: Common Mistakes ────────────────────────────────
children.push(
  h1('10. Common Mistakes Beginners Make'),
  body('Awareness of these pitfalls will save you days of frustration.'),
  spacer(),
  h2('TypeScript Mistakes'),
  bullet('Using any everywhere — it defeats the purpose of TypeScript. Use unknown and narrow it with type guards'),
  bullet('Not enabling strict mode — always set "strict": true in tsconfig.json from day 1'),
  bullet('Confusing type and interface — prefer interface for objects you\'ll extend; use type for unions'),
  spacer(),
  h2('NestJS Mistakes'),
  bullet('Forgetting to import modules — if a service isn\'t found, you probably forgot to add its module to imports[]'),
  bullet('Putting business logic in controllers — controllers only handle HTTP. All logic belongs in services'),
  bullet('Not using DTOs for validation — always define DTOs with class-validator decorators, never trust raw req.body'),
  bullet('Global ValidationPipe not enabled — add it in main.ts: app.useGlobalPipes(new ValidationPipe({ whitelist: true }))'),
  spacer(),
  h2('Database Mistakes'),
  bullet('Not running migrations — direct schema changes in dev without migrations will bite you in production'),
  bullet('N+1 query problem — always check if your TypeORM/Prisma queries are generating unexpected extra SQL queries'),
  bullet('Storing plain text passwords — ALWAYS hash with bcrypt before storing'),
  spacer(),
  h2('API Design Mistakes'),
  bullet('Inconsistent status codes — 200 for everything. Use 201 for creation, 204 for deletion, 400 for validation errors'),
  bullet('Leaking internal errors to clients — never send raw database errors to the client; use custom exception filters'),
  bullet('No pagination on list endpoints — returning 10,000 records on GET /posts will crash your app'),
  spacer(),
  divider(),
);

// ── Section 11: Cheatsheet ─────────────────────────────────────
children.push(
  h1('11. Quick Reference Cheatsheet'),
  spacer(),
  h2('NestJS CLI Commands'),
  bullet('nest new <name> — scaffold new project'),
  bullet('nest generate module <name> (alias: g mo)'),
  bullet('nest generate controller <name> (alias: g co)'),
  bullet('nest generate service <name> (alias: g s)'),
  bullet('nest generate resource <name> — generates full CRUD module'),
  bullet('nest build — compile TypeScript'),
  bullet('npm run start:dev — start with hot reload'),
  spacer(),
  h2('HTTP Status Codes Reference'),
  bullet('200 OK — successful GET / PUT / PATCH'),
  bullet('201 Created — successful POST (new resource created)'),
  bullet('204 No Content — successful DELETE'),
  bullet('400 Bad Request — validation error / malformed request'),
  bullet('401 Unauthorized — not authenticated (no/invalid token)'),
  bullet('403 Forbidden — authenticated but not authorized'),
  bullet('404 Not Found — resource doesn\'t exist'),
  bullet('409 Conflict — duplicate resource (e.g., email already registered)'),
  bullet('422 Unprocessable Entity — semantic validation error'),
  bullet('500 Internal Server Error — unexpected server crash'),
  spacer(),
  h2('TypeORM Quick Reference'),
  bullet('@Entity() — mark a class as a database table'),
  bullet('@Column() — map a property to a table column'),
  bullet('@PrimaryGeneratedColumn("uuid") — auto UUID primary key'),
  bullet('@CreateDateColumn() / @UpdateDateColumn() — automatic timestamps'),
  bullet('@OneToMany(() => Post, (post) => post.user) — one user, many posts'),
  bullet('@ManyToOne(() => User, (user) => user.posts) — post belongs to user'),
  spacer(),
  h2('JWT Flow Summary'),
  numbered('User sends POST /auth/login with email + password'),
  numbered('Server validates credentials, hashes match → success'),
  numbered('Server signs a JWT with user ID and role in payload'),
  numbered('Server returns { access_token: "eyJ..." }'),
  numbered('Client stores token (memory or localStorage)'),
  numbered('Client sends Authorization: Bearer eyJ... on every protected request'),
  numbered('JWT Guard extracts and verifies token → attaches user to request'),
  spacer(),
  divider(),
);

// ── Final encouragement ────────────────────────────────────────
children.push(
  h1('12. Final Words & Mindset'),
  body('Three months is enough time to go from zero to a confident backend developer — but only if you build, not just watch or read. Every concept in this roadmap is something you will understand 10x better the moment you write the code yourself and see it fail, debug it, and make it work.'),
  spacer(),
  body('Two rules for the entire journey:'),
  bullet('Code every single day — even 30 minutes is better than nothing'),
  bullet('Build things you can break — experiment, make mistakes, read error messages carefully'),
  spacer(),
  body('By the end of week 12 you will have: a real PostgreSQL-backed REST API, JWT authentication, a full test suite, Postman collection, Swagger docs, and a live deployment. That is more than most job postings ask for.'),
  spacer(),
  infoBox('You got this.',
    'Save this document. Come back to it every week. Check off the sprints as you complete them. The roadmap only works if you work it.',
    COLORS.lightGreen, COLORS.secondary),
);

// ── Build & export ─────────────────────────────────────────────
const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullets',
        levels: [{
          level: 0, format: LevelFormat.BULLET, text: '\u2022',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
      {
        reference: 'numbers',
        levels: [{
          level: 0, format: LevelFormat.DECIMAL, text: '%1.',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        }],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: 'Arial', size: 22 } },
    },
    paragraphStyles: [
      {
        id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: COLORS.headerBg },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      {
        id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: COLORS.primary },
        paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1 },
      },
      {
        id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 24, bold: true, font: 'Arial', color: COLORS.secondary },
        paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2 },
      },
    ],
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: COLORS.primary, space: 4 } },
            children: [new TextRun({ text: 'Backend Engineering Roadmap — TypeScript + NestJS', font: 'Arial', size: 18, color: COLORS.primary, italics: true })],
          }),
        ],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            border: { top: { style: BorderStyle.SINGLE, size: 4, color: COLORS.gray200, space: 4 } },
            children: [
              new TextRun({ text: 'Page ', font: 'Arial', size: 18, color: COLORS.gray700 }),
              new TextRun({ children: [PageNumber.CURRENT], font: 'Arial', size: 18, color: COLORS.gray700 }),
            ],
          }),
        ],
      }),
    },
    children,
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync('./Backend_Engineering_Roadmap.docx', buf);
  console.log('Done!');
}).catch(console.error);