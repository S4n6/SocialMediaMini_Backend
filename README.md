# SocialMediaMini — Backend API

> **NestJS** · **PostgreSQL** · **Redis** · **RabbitMQ** · **Prisma ORM** · **TypeScript**

A production-ready social media backend built with Clean Architecture principles. Handles authentication, posts, real-time notifications (SSE), follow/unfollow, reactions, messaging, media processing, and more.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Modules](#modules)
- [Auth Flows](#auth-flows)
- [Environment Variables](#environment-variables)
- [Running Locally](#running-locally)
- [Running with Docker](#running-with-docker)
- [Running Tests](#running-tests)
- [API Overview](#api-overview)

---

## Architecture

This project follows **Clean Architecture** (also known as Hexagonal / Ports-and-Adapters):

```
src/
├── modules/               # Feature modules (vertical slices)
│   ├── auth/
│   │   ├── domain/        # Entities, value objects, domain events, repository interfaces
│   │   ├── application/   # Use cases, application services, ports
│   │   ├── infrastructure/ # Repository implementations, security adapters
│   │   └── presentation/  # Controllers, request/response DTOs
│   ├── users/
│   ├── posts/
│   ├── notification/      # SSE-based real-time notifications
│   ├── messaging/         # Conversations & messages (REST)
│   ├── follow/
│   ├── reactions/
│   ├── comments/
│   ├── story/
│   ├── post-medias/
│   ├── mailer/            # Publishes email tasks to RabbitMQ
│   ├── cache/             # Redis cache service
│   └── storage/           # Cloudinary / S3 adapter
│
├── infrastructure/
│   └── message-queue/     # RabbitMQ publisher/consumer (amqplib)
│
├── shared/
│   ├── guards/            # JwtAuthGuard, GoogleAuthGuard
│   ├── filters/           # GlobalExceptionFilter
│   ├── middlewares/       # CORS, rate-limit, security headers, etc.
│   └── services/          # ErrorMonitoringService
│
├── database/
│   └── prisma.module.ts   # PrismaClient singleton
│
└── config/                # JWT config, env helpers
```

**In-process events** (side effects like session revocation after password change, or creating a notification on follow) are handled by **`@nestjs/event-emitter`** (EventEmitter2). This is separate from RabbitMQ, which is used for cross-process, durable tasks (email delivery, media processing).

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [NestJS](https://nestjs.com) |
| Language | TypeScript 5 |
| Database | PostgreSQL (via [Prisma ORM](https://prisma.io)) |
| Cache / OTP store | Redis (via `ioredis`) |
| Message Queue | RabbitMQ (AMQP) |
| Authentication | JWT (access + refresh tokens) + Google OAuth 2.0 |
| Media Storage | Cloudinary (default) or AWS S3 |
| Password Hashing | bcrypt |
| Validation | `class-validator` / `class-transformer` |
| Testing | Jest |

---

## Modules

| Module | Description |
|---|---|
| **auth** | Registration, login, logout, token refresh, email OTP verification, password reset, Google OAuth |
| **users** | User profiles, search, follow counts |
| **posts** | Create / read / delete posts, feed |
| **post-medias** | Media upload, processing callback from Go worker |
| **comments** | Comment on posts, nested replies |
| **reactions** | Like / react to posts and comments |
| **follow** | Follow / unfollow users, follower/following lists |
| **story** | 24-hour stories |
| **notification** | Real-time notifications via SSE (Server-Sent Events) |
| **messaging** | Private & group conversations, messages (REST) |
| **mailer** | Publishes email jobs to RabbitMQ (rendered & sent by Go worker) |
| **cache** | Redis-backed cache service (wrapper around `ioredis`) |
| **storage** | Unified file upload (Cloudinary or S3, set via `STORAGE_PROVIDER`) |

---

## Auth Flows

### Registration + Email OTP Verification

```
POST /auth/register   { fullName, email, username, ... }
  → User created (unverified), 6-digit OTP sent to email (valid 10 min)

POST /auth/verify-email   { email, code, password }
  → Email marked verified, password set, user can now login

POST /auth/resend-verification   { email }
  → New OTP sent (rate-limited: 1 request per 60s, max 5 attempts before OTP invalidated)
```

> **Why 6-digit OTP?** Users can type `347821` trivially compared to copying a 64-character URL token from an email link. Security safeguards: 10-minute TTL, 5-attempt lockout before invalidation, CSPRNG generation via `crypto.randomInt`.

### Login

```
POST /auth/login   { identifier (email or username), password }
  → Sets httpOnly cookies (web) or returns tokens in body (mobile, x-client-type: mobile)
```

### Password Reset (opaque hex token, not OTP)

```
POST /auth/forgot-password   { email }
  → Sends a secure reset link with 64-char hex token (valid 15 min)

POST /auth/reset-password   { token, newPassword, confirmPassword }
  → Password updated, all sessions revoked
```

### Token Refresh

```
POST /auth/refresh
  → Reads refresh token from cookie (web) or body (mobile)
  → Returns new access + refresh tokens
```

### Google OAuth

```
GET /auth/google           → Redirects to Google consent screen
GET /auth/google/callback  → Exchanges code, creates/updates user, sets cookies, redirects to frontend
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/socialmedia

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672
RABBITMQ_QUEUE=tasks

# JWT
JWT_SECRET=your-very-long-random-secret
JWT_EXPIRES_IN=24h

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Storage (cloudinary or s3)
STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# AWS S3 (if STORAGE_PROVIDER=s3)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=

# Frontend URL (used for OAuth redirects)
FRONTEND_URL=http://localhost:3001
```

---

## Running Locally

**Prerequisites:** Node.js 20+, PostgreSQL, Redis, RabbitMQ.

```bash
# 1. Install dependencies
npm install

# 2. Copy environment variables
cp .env.example .env
# Edit .env with your credentials

# 3. Run database migrations
npx prisma migrate dev

# 4. Generate Prisma client
npx prisma generate

# 5. Start in development (watch mode)
npm run start:dev
```

The API will be available at `http://localhost:3000`.

---

## Running with Docker

```bash
# Start PostgreSQL, Redis, and RabbitMQ via Docker Compose
docker-compose up -d

# Then start the NestJS app locally (or in Docker)
npm run start:dev
```

---

## Running Tests

```bash
# Unit tests
npm run test

# Unit tests in watch mode
npm run test:watch

# Test coverage report
npm run test:cov

# E2E tests
npm run test:e2e
```

---

## API Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | — | Register a new user |
| `POST` | `/auth/verify-email` | — | Verify email with 6-digit OTP |
| `POST` | `/auth/resend-verification` | — | Resend verification OTP |
| `POST` | `/auth/login` | — | Login (email/username + password) |
| `POST` | `/auth/logout` | — | Logout (revoke refresh token) |
| `POST` | `/auth/logout-all` | JWT | Logout from all devices |
| `POST` | `/auth/refresh` | — | Refresh access token |
| `POST` | `/auth/forgot-password` | — | Request password reset email |
| `POST` | `/auth/reset-password` | — | Reset password with token |
| `GET` | `/auth/google` | — | Initiate Google OAuth |
| `GET` | `/auth/google/callback` | — | Google OAuth callback |
| `GET` | `/users/:id` | JWT | Get user profile |
| `POST` | `/posts` | JWT | Create a post |
| `GET` | `/posts/:id` | JWT | Get a post |
| `POST` | `/follow/:userId` | JWT | Follow a user |
| `DELETE` | `/follow/:userId` | JWT | Unfollow a user |
| `POST` | `/reactions` | JWT | React to a post or comment |
| `GET` | `/notifications` | JWT (SSE) | Real-time notification stream |
| `GET` | `/notifications/unread-count` | JWT | Count unread notifications |
| `POST` | `/messaging/conversations` | JWT | Create a conversation |
| `GET` | `/messaging/conversations` | JWT | List user conversations |
| `POST` | `/messaging/conversations/:id/messages` | JWT | Send a message |
| `GET` | `/messaging/conversations/:id/messages` | JWT | Get messages |

---

## License

MIT
