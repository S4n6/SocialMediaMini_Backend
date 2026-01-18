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

## Testing Strategy

### Testing Philosophy

**Test Smart, Not Everything** - Focus on business value, not coverage metrics.

**Priority Levels:**

1. 🔴 **High Priority** - Must have tests (business-critical)
2. 🟡 **Medium Priority** - Should have tests (complex logic)
3. 🟢 **Low Priority** - Optional (simple/generated code)

### What to Test by Layer

#### 🔴 Domain Layer (High Priority)

**ALWAYS test:**

- ✅ Entities with business logic
- ✅ Value objects with validation
- ✅ Domain services with complex rules
- ✅ Factories with creation logic
- ✅ Domain events (structure validation)

**SKIP:**

- ❌ Simple getters/setters
- ❌ Pure data classes with no logic
- ❌ Trivial constructors

**Example:**

```typescript
// ✅ TEST THIS - Has business logic
class User {
  follow(target: User): void {
    if (this.hasReachedFollowingLimit()) throw new Error();
    if (this.isFreshAccount() && this.followingCount >= 20) throw new Error();
    // ... complex business rules
  }
}

// ❌ DON'T TEST - Just getters
class User {
  get id(): string {
    return this._id;
  }
  get email(): string {
    return this._email;
  }
}
```

#### 🟡 Application Layer (Medium Priority)

**ALWAYS test:**

- ✅ Use cases with complex orchestration
- ✅ Use cases calling multiple repositories
- ✅ Use cases with branching logic
- ✅ Subscribers with side effects

**SKIP:**

- ❌ Simple CRUD use cases (just save/find)
- ❌ Thin wrapper use cases
- ❌ DTOs with no transformation logic

**Example:**

```typescript
// ✅ TEST THIS - Complex orchestration
class CreateUserUseCase {
  async execute(cmd: CreateUserCommand) {
    // 1. Validate uniqueness
    if (await this.repo.findByEmail(cmd.email)) throw new Error();
    // 2. Create with factory
    const user = await UserFactory.create(cmd);
    // 3. Save
    await this.repo.save(user);
    // 4. Publish events
    await this.eventBus.publishAll(user.getDomainEvents());
    // Complex flow = needs testing
  }
}

// ❌ DON'T TEST - Just delegates
class GetUserUseCase {
  async execute(id: string) {
    return this.repo.findById(id); // Too simple
  }
}
```

#### 🟢 Infrastructure Layer (Low Priority)

**TEST selectively:**

- ✅ Mappers with complex transformations
- ✅ Adapters with business logic
- ✅ Custom repository methods (complex queries)

**SKIP:**

- ❌ Simple Prisma repository wrappers
- ❌ Direct passthrough adapters
- ❌ Configuration files

#### 🟢 Presentation Layer (Low Priority)

**TEST via E2E instead:**

- ⚠️ Controllers (use E2E tests)
- ⚠️ DTOs (validated by class-validator)
- ⚠️ Mappers (simple transformations)

### Test Types

#### 1️⃣ Unit Tests (.spec.ts)

**Purpose:** Test single unit in isolation with mocks

**File Location:**

```
src/modules/[module]/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── user.entity.spec.ts        ← Same folder
│   ├── value-objects/
│   │   ├── email.value-object.ts
│   │   └── email.value-object.spec.ts ← Same folder
├── application/
│   └── use-cases/
│       ├── create-user.use-case.ts
│       └── create-user.use-case.spec.ts ← Same folder
```

**Naming:** `[filename].spec.ts` (next to source file)

**What to Unit Test:**

- ✅ Domain entities (business methods)
- ✅ Value objects (validation)
- ✅ Use cases (with mocked dependencies)
- ✅ Factories (creation logic)
- ✅ Domain events

**Mocking Strategy:**

```typescript
// Mock repositories
const mockUserRepo = {
  save: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

// Mock event bus
const mockEventBus = {
  publish: jest.fn(),
  publishAll: jest.fn(),
};

// Test use case
const useCase = new CreateUserUseCase(mockUserRepo, mockEventBus);
```

**Best Practices:**

- Use `describe()` blocks for logical grouping
- One assertion per test (or closely related assertions)
- Arrange-Act-Assert pattern
- Test both happy path AND edge cases
- Mock external dependencies (repos, event bus, ports)

**Example:**

```typescript
describe('User Entity', () => {
  describe('follow', () => {
    it('should follow another user successfully', () => {
      // Arrange
      const user = createTestUser();
      const target = createTestUser({ id: 'other-id' });

      // Act
      user.follow(target.id, target.username);

      // Assert
      expect(user.isFollowing(target.id)).toBe(true);
      expect(user.followingCount).toBe(1);
    });

    it('should throw when following self', () => {
      const user = createTestUser();
      expect(() => user.follow(user.id, user.username)).toThrow(
        CannotFollowSelfException,
      );
    });
  });
});
```

#### 2️⃣ Integration Tests (.integration.spec.ts)

**Purpose:** Test multiple layers working together with real dependencies

**File Location:**

```
test/integration/
├── users/
│   ├── user-registration.integration.spec.ts
│   ├── user-follow.integration.spec.ts
│   └── user-profile-update.integration.spec.ts
└── auth/
    └── login-flow.integration.spec.ts
```

**Naming:** `[feature].integration.spec.ts` (in test/ folder)

**What to Integration Test:**

- ✅ Use case → Repository → Database (real Prisma)
- ✅ Event emission → Subscriber execution
- ✅ Cross-module interactions
- ✅ Complex workflows (multi-step processes)

**Setup Requirements:**

```typescript
// Use TestingModule from NestJS
beforeEach(async () => {
  const module: TestingModule = await Test.createTestingModule({
    imports: [
      UsersModule,
      PrismaModule,
      // Use in-memory/test database
    ],
  }).compile();

  userService = module.get<UserApplicationService>(UserApplicationService);
  prisma = module.get<PrismaService>(PrismaService);
});

afterEach(async () => {
  // Clean up test data
  await prisma.user.deleteMany();
});
```

**Best Practices:**

- Use separate test database (or in-memory SQLite)
- Clean up data after each test
- Test real database interactions
- Test event-driven flows
- Mock only external APIs (email, payment, etc.)

**Example:**

```typescript
describe('User Registration Integration', () => {
  it('should create user and emit domain event', async () => {
    // Arrange
    const command = {
      username: 'johndoe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      fullName: 'John Doe',
    };

    // Act
    const result = await userService.createUser(command);

    // Assert - Check database
    const savedUser = await prisma.user.findUnique({
      where: { id: result.id },
    });
    expect(savedUser).toBeDefined();
    expect(savedUser.email).toBe('john@example.com');

    // Assert - Check event was published
    // (use event listener mock to verify)
  });
});
```

#### 3️⃣ E2E Tests (.e2e-spec.ts)

**Purpose:** Test full HTTP request/response cycle

**File Location:**

```
test/e2e/
├── auth.e2e-spec.ts
├── users.e2e-spec.ts
├── posts.e2e-spec.ts
└── follow.e2e-spec.ts
```

**Naming:** `[module].e2e-spec.ts` (in test/e2e/ folder)

**What to E2E Test:**

- ✅ API endpoints (controllers)
- ✅ Authentication/authorization flows
- ✅ Complete user journeys
- ✅ Error responses (400, 401, 404, 500)

**Setup:**

```typescript
describe('Users API (e2e)', () => {
  let app: INestApplication;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    // Login and get token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'Test123!' });
    authToken = response.body.data.accessToken;
  });
});
```

**Best Practices:**

- Use `supertest` for HTTP requests
- Test authentication headers
- Test request validation (DTO errors)
- Test pagination/filtering
- Use realistic data
- Test error responses

**Example:**

```typescript
describe('POST /users', () => {
  it('should create new user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'newuser',
        email: 'new@example.com',
        password: 'SecurePass123!',
        fullName: 'New User',
      })
      .expect(201)
      .expect((res) => {
        expect(res.body.data).toHaveProperty('id');
        expect(res.body.data.email).toBe('new@example.com');
        expect(res.body.message).toBe('User created successfully');
      });
  });

  it('should return 400 for invalid email', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({
        username: 'newuser',
        email: 'invalid-email',
        password: 'SecurePass123!',
      })
      .expect(400)
      .expect((res) => {
        expect(res.body.message).toContain('email');
      });
  });

  it('should return 401 without auth token', () => {
    return request(app.getHttpServer()).get('/users/me').expect(401);
  });
});
```

### Test Coverage Guidelines

**Target Coverage (by layer):**

- Domain Layer: 80-90% (high value)
- Application Layer: 60-70% (use cases only)
- Infrastructure Layer: 30-40% (complex mappers only)
- Presentation Layer: 20-30% (via E2E tests)

**Don't Chase 100% Coverage** - Focus on critical paths and business logic.

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm test -- --testPathPattern=".spec.ts$"

# Run only integration tests
npm test -- --testPathPattern=".integration.spec.ts$"

# Run only e2e tests
npm run test:e2e

# Run specific module tests
npm test -- users/domain

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Test File Organization

```
src/modules/users/
├── domain/
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── user.entity.spec.ts          ← Unit test
│   └── value-objects/
│       ├── email.value-object.ts
│       └── email.value-object.spec.ts   ← Unit test
├── application/
│   └── use-cases/
│       ├── create-user.use-case.ts
│       └── create-user.use-case.spec.ts ← Unit test (with mocks)
test/
├── integration/
│   └── users/
│       ├── user-registration.integration.spec.ts
│       └── user-follow.integration.spec.ts
└── e2e/
    └── users.e2e-spec.ts
```

### Common Testing Patterns

#### Pattern 1: Test Factory Functions

```typescript
// Create reusable test helpers
function createTestUser(overrides?: Partial<UserOptions>): User {
  return new User(
    'test-id',
    'testuser',
    'test@example.com',
    createTestProfile(),
    {
      passwordHash: 'hashed',
      status: UserStatus.ACTIVE,
      ...overrides,
    },
  );
}
```

#### Pattern 2: Mock Repository

```typescript
const mockRepo: jest.Mocked<IUserRepository> = {
  save: jest.fn(),
  findById: jest.fn(),
  findByEmail: jest.fn(),
  delete: jest.fn(),
};
```

#### Pattern 3: Test Domain Events

```typescript
it('should emit UserRegisteredEvent', () => {
  const user = new User('id', 'user', 'email@test.com', profile);

  const events = user.getDomainEvents();
  expect(events).toHaveLength(1);
  expect(events[0]).toBeInstanceOf(UserRegisteredEvent);
  expect(events[0].eventName).toBe('user.registered');
});
```

#### Pattern 4: Test Exceptions

```typescript
it('should throw ValidationException for invalid email', () => {
  expect(() => UserEmail.create('invalid')).toThrow(ValidationException);

  expect(() => UserEmail.create('invalid')).toThrow('Invalid email format');
});
```

### When to Write Tests

**During Development:**

- Write tests for new features alongside code
- Test-first for complex business logic
- Refactor with test safety net

**During Refactoring:**

- Add tests before refactoring legacy code
- Ensure existing behavior doesn't break
- Document expected behavior via tests

**Priority Order:**

1. Domain entities with business rules
2. Critical use cases (user registration, payment)
3. Value objects with validation
4. Complex mappers/transformations
5. E2E for critical user journeys
