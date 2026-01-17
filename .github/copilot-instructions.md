# 🏛️ Social Media Mini Backend - AI Agent Instructions

## Project Overview

**Architecture:** Modular Monolith with Clean Architecture + DDD  
**Stack:** NestJS (TypeScript), PostgreSQL (Prisma), Redis (BullMQ + Cache), WebSocket/SSE  
**Pattern:** Event-Driven with @nestjs/event-emitter for domain events

## Critical Architecture Rules

### 1. Module Structure (4-Layer Clean Architecture)

```
src/modules/[module]/
├── domain/                    # Pure TypeScript - NO framework imports
│   ├── entities/             # Rich models with business methods
│   ├── value-objects/        # Immutable Email, Password, etc.
│   ├── repositories/         # Interfaces ONLY (i-[name].repository.ts)
│   ├── events/              # Domain events (UserRegisteredEvent)
│   └── exceptions/          # Business rule violations
├── application/
│   ├── use-cases/           # [verb]-[noun].use-case.ts
│   ├── subscribers/         # Event handlers (side effects)
│   ├── ports/               # i-[service].service.ts (external contracts)
│   └── [module]-application.service.ts  # Orchestrates use cases
├── infrastructure/
│   ├── persistence/
│   │   ├── mappers/        # Domain Entity ↔ Prisma Model
│   │   └── repositories/   # Implements domain interfaces
│   ├── adapters/           # Implements application ports
│   └── security/           # Auth, hashing, JWT
├── presentation/
│   ├── controllers/        # HTTP endpoints
│   ├── dto/               # Validation DTOs (class-validator)
│   └── strategies/        # Passport strategies
├── [module].module.ts     # DI configuration
└── [module].constants.ts  # DI tokens (SCREAMING_SNAKE_CASE)
```

**Reference:** `src/modules/auth/` is the canonical clean architecture example.

### 2. Dependency Rule (Critical!)

- **Domain:** NO imports from other layers. Pure TypeScript only.
- **Application:** Import domain only. Use ports for external services.
- **Infrastructure:** Implements domain interfaces + application ports.
- **Presentation:** Uses application layer services.

### 3. Repository Pattern

```typescript
// Domain interface - ONLY these methods
interface IUserRepository {
  save(user: User): Promise<void>; // Smart save (INSERT or UPDATE)
  findById(id: string): Promise<User | null>;
  delete(id: string): Promise<void>;
}

// Infrastructure implementation
class UserPrismaRepository implements IUserRepository {
  async save(user: User) {
    const data = this.mapper.toPrisma(user);
    await this.prisma.user.upsert({
      where: { id: data.id },
      create: data,
      update: data,
    });
  }
}
```

**Never** expose `update(id, partial)` in domain interface - violates encapsulation.

### 4. Cross-Module Communication

**Wrong:** `import { UserRepository } from '../users/...';` ❌  
**Right:** Create mapper + inject other module's service:

```typescript
// infrastructure/persistence/mappers/user.mapper.ts
@Injectable()
export class UserMapper {
  constructor(
    @Inject(USER_REPOSITORY_TOKEN) private usersRepo: IUserRepository,
  ) {}

  toAuthUser(usersUser: User): AuthUser {
    /* map fields */
  }
}
```

**Example:** `auth` module uses `UserMapper` to translate Users domain to Auth domain.

### 5. Event-Driven Side Effects

```typescript
// Use case emits event
class RegisterUserUseCase {
  async execute(req) {
    await this.userRepo.save(user);
    this.eventEmitter.emit('user.registered', new UserRegisteredEvent(user));
  }
}

// Subscriber handles side effect
@Injectable()
class UserRegisteredSubscriber {
  @OnEvent('user.registered')
  async handle(event: UserRegisteredEvent) {
    await this.emailService.sendVerification(event.user.email);
  }
}
```

**Configure:** `EventEmitterModule.forRoot({ wildcard: false, maxListeners: 10 })` in app.module.ts

### 6. Dependency Injection Pattern

```typescript
// [module].constants.ts
export const USER_REPOSITORY_TOKEN = 'USER_REPOSITORY';
export const EMAIL_SERVICE_TOKEN = 'EMAIL_SERVICE';

// [module].module.ts
providers: [
  { provide: USER_REPOSITORY_TOKEN, useClass: UserPrismaRepository },
  { provide: EMAIL_SERVICE_TOKEN, useClass: MailerEmailAdapter },
]

// Use case injection
constructor(@Inject(USER_REPOSITORY_TOKEN) private repo: IUserRepository) {}
```

## Developer Workflows

### Commands

- **Dev:** `npm run dev` (API server with watch mode)
- **Worker:** `npm run start:worker` (BullMQ processors)
- **Both:** `npm run start:all` (API + Worker concurrently)
- **Build:** `npm run build` (TypeScript compilation)
- **Test:** `npm run test` (Jest unit tests)

### Database (Prisma)

- **Schema:** `prisma/schema.prisma` (snake_case column names with @map)
- **Migrate:** `npx prisma migrate dev --name [description]`
- **Generate:** `npx prisma generate` (after schema changes)
- **Studio:** `npx prisma studio` (DB GUI on :5555)

### Docker Setup

```bash
docker-compose up -d  # Starts API + Worker containers
# Requires: DATABASE_URL, REDIS_URL, REDIS_URL_WORKER in .env
```

## Project-Specific Patterns

### 1. Dual Redis Instances

- **REDIS_URL:** Cache (via `@nestjs/cache-manager` + Keyv)
- **REDIS_URL_WORKER:** BullMQ queues (separate connection)
- **Why:** Prevents cache invalidation from affecting job queues

### 2. Worker Architecture

- **Main:** `workers/main.ts` bootstraps `ProcessorModule`
- **Processors:** `src/modules/processors/` contains BullMQ consumers
- **Pattern:** API enqueues jobs → Worker processes async

### 3. Shared Infrastructure

- **Events:** `src/infrastructure/events/` - Custom EventBus (alternative to @nestjs/event-emitter)
- **WebSocket:** `src/infrastructure/websocket/` - Socket.io gateway
- **Middlewares:** `src/shared/middlewares/` - CORS, Rate Limit, Security Headers

### 4. Module Organization

- **Core Modules:** users, auth, posts, comments, reactions, follow
- **Support Modules:** mailer, cache, cloudinary (file upload), notification
- **Suffix:** No "Module" suffix in folder names (`auth/` not `auth-module/`)

### 5. Rich Domain Models

```typescript
// Good - business logic in entity
class User {
  verifyEmail(): User {
    if (this.isEmailVerified) throw new AlreadyVerifiedException();
    return new User({
      ...this,
      isEmailVerified: true,
      emailVerifiedAt: new Date(),
    });
  }
}

// Bad - anemic model
class User {
  id;
  email;
  isEmailVerified;
}
```

### 6. Value Objects Pattern

```typescript
// domain/value-objects/email.vo.ts
export class Email {
  constructor(private readonly value: string) {
    if (!this.isValid(value)) throw new InvalidEmailException();
  }
  private isValid(email: string): boolean {
    /* regex */
  }
  getValue(): string {
    return this.value;
  }
}
```

Use for: Email, Password, UserId, Money, Coordinates

## Anti-Patterns to Avoid

1. **Generic `update()` in repositories** - Use domain methods instead
2. **Direct Prisma in domain/application** - Always use mappers in infrastructure
3. **Cross-module entity imports** - Use mappers + injected services
4. **Mixing concerns in use cases** - Side effects go to subscribers
5. **Flat module structure** - Always follow 4-layer architecture
6. **Missing DI tokens** - Define all tokens in constants file

## Migration Guide

Some modules predate clean architecture (e.g., posts_old/, notification_old/). When refactoring:

1. Create new 4-layer structure
2. Move domain logic from services to entities
3. Extract ports for external dependencies
4. Create mappers for Prisma models
5. Wire with DI tokens in module file
6. Add event subscribers for side effects

**Reference Implementation:** Compare `auth/` (clean) vs commented-out modules in app.module.ts
