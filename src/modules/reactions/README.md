# Reactions Module - Clean Architecture

## Kiến trúc tổng quan

Module reactions được thiết kế theo Clean Architecture với 4 tầng chính:

```
├── Presentation Layer (Controller)
├── Application Layer (Use Cases + Interfaces)
├── Domain Layer (Entities + Business Rules)
└── Infrastructure Layer (Data Access + External Services)
```

## Cấu trúc thư mục

```
reactions/
├── reactions.module.ts                  # Module configuration
├── presentation/                        # Presentation Layer
│   └── reactions.controller.ts         # REST API endpoints
├── application/                         # Application Layer
│   ├── reaction-application.service.ts # Application orchestrator
│   ├── dto/                           # Data Transfer Objects
│   ├── interfaces/                    # External service contracts
│   │   ├── external-services.interface.ts
│   │   └── tokens.ts                  # Dependency injection tokens
│   ├── mappers/                      # Entity ↔ DTO transformation
│   │   └── reaction.mapper.ts
│   └── use-cases/                    # Business use cases
├── domain/                           # Domain Layer (Core Business Logic)
│   ├── reaction.entity.ts           # Domain entity
│   ├── reaction.events.ts           # Domain events
│   ├── reaction.exceptions.ts       # Business exceptions
│   ├── factories/                   # Entity factories
│   ├── repositories/                # Repository contracts
│   │   └── reaction.repository.ts   # Abstract repository interface
│   └── services/                    # Domain services
│       └── reaction-domain.service.ts
└── infrastructure/                   # Infrastructure Layer
    ├── external-services.ts         # External service implementations
    ├── prisma-reaction.repository.ts # Repository implementation
    └── queue-notification.service.ts # Queue service implementation
```

## Nguyên tắc thiết kế

### 1. Dependency Direction (Dependency Inversion)

- Domain layer không depend vào ai
- Application layer depend vào Domain
- Infrastructure layer depend vào Application interfaces
- Presentation layer depend vào Application

### 2. External Services Pattern

Thay vì import trực tiếp modules khác (tạo circular dependency), sử dụng pattern:

```typescript
// Interface (Application layer)
export interface ExternalPostService {
  findById(postId: string): Promise<PostInfo | null>;
}

// Token for DI
export const EXTERNAL_POST_SERVICE = Symbol('ExternalPostService');

// Implementation (Infrastructure layer)
@Injectable()
export class PrismaPostService implements ExternalPostService {
  // Direct database access, không qua Post module
}
```

### 3. Repository Pattern (Domain-driven)

```typescript
// Domain định nghĩa interface
export abstract class ReactionRepository {
  abstract save(reaction: ReactionEntity): Promise<ReactionEntity>;
  abstract findById(id: string): Promise<ReactionEntity | null>;
}

// Infrastructure implement
export class PrismaReactionRepository extends ReactionRepository {
  // Implementation details
}
```

### 4. Use Cases (Single Responsibility)

Mỗi use case thực hiện một business operation:

- `CreateReactionUseCase` - Tạo/cập nhật reaction
- `DeleteReactionUseCase` - Xóa reaction
- `GetPostReactionsUseCase` - Lấy reactions của post

### 5. Domain Services vs Repository

- **Repository**: Data access (CRUD operations)
- **Domain Service**: Business logic phức tạp (validation, business rules)

## Dependency Injection Setup

```typescript
@Module({
  providers: [
    // Domain services
    ReactionDomainService,
    ReactionFactory,

    // Repository binding
    {
      provide: ReactionRepository,
      useClass: PrismaReactionRepository,
    },

    // External services binding
    {
      provide: EXTERNAL_POST_SERVICE,
      useClass: PrismaPostService,
    },
    {
      provide: EXTERNAL_USER_SERVICE,
      useClass: PrismaUserService,
    },
  ],
})
export class ReactionsModule {}
```

## Lợi ích của kiến trúc này

### 1. Loose Coupling

- Modules không depend trực tiếp vào nhau
- Dễ dàng thay đổi implementation
- Tránh circular dependencies

### 2. Testability

- Mock dễ dàng các external services
- Unit test từng layer độc lập
- Integration test qua interfaces

### 3. Maintainability

- Separation of concerns rõ ràng
- Code dễ đọc và hiểu
- Dễ dàng mở rộng tính năng

### 4. Domain-focused

- Business logic tập trung ở Domain layer
- Entities chứa business rules
- Domain services xử lý logic phức tạp

## Usage Examples

```typescript
// Inject use case trong controller
@Controller('reactions')
export class ReactionsController {
  constructor(private readonly createReactionUseCase: CreateReactionUseCase) {}

  @Post()
  async createReaction(@Body() dto: CreateReactionDto) {
    return this.createReactionUseCase.execute(dto, userId);
  }
}

// Use case sử dụng domain service và external services
@Injectable()
export class CreateReactionUseCase {
  constructor(
    private readonly reactionDomainService: ReactionDomainService,
    @Inject(EXTERNAL_POST_SERVICE)
    private readonly postService: ExternalPostService,
  ) {}
}
```

## Best Practices

1. **Domain Entity**: Chứa business rules và validation
2. **Domain Service**: Logic nghiệp vụ phức tạp không thuộc về một entity
3. **Use Cases**: Orchestrate domain services và external services
4. **Mappers**: Transform data giữa layers
5. **External Services**: Giao tiếp với modules khác qua interfaces
6. **Repository**: Data access abstraction

Kiến trúc này đảm bảo code maintainable, testable, và scalable theo thời gian.
