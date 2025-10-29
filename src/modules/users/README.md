# Users Module - Clean Architecture Implementation

## 📁 Architecture Overview

This module follows **Clean Architecture** principles with clear separation of concerns across 4 layers:

```
src/modules/users/
├── 🔵 domain/              # Domain Layer (Core Business Logic)
├── 🟢 application/         # Application Layer (Use Cases & DTOs)
├── 🟡 infrastructure/      # Infrastructure Layer (External Services)
└── 🔴 presentation/        # Presentation Layer (Controllers & DTOs)
```

## 🎯 Clean Architecture Compliance

### ✅ Domain Layer (`domain/`)

- **Zero external dependencies** - Pure business logic
- **Entities**: Core business objects with behavior
- **Value Objects**: Immutable objects representing concepts
- **Domain Events**: Express business events that occurred
- **Domain Services**: Complex business logic coordination
- **Repository Interfaces**: Define data access contracts

### ✅ Application Layer (`application/`)

- **Use Cases**: Orchestrate domain logic for specific operations
- **Application Services**: Coordinate multiple use cases
- **Application DTOs**: Pure data structures without validation
- **Command/Query Pattern**: CQRS-style operation separation
- **Event Handlers**: React to domain events

### ✅ Infrastructure Layer (`infrastructure/`)

- **Repository Implementations**: Data persistence logic
- **External Service Adapters**: Third-party integrations
- **Infrastructure Services**: Technical capabilities

### ✅ Presentation Layer (`presentation/`)

- **Controllers**: HTTP API endpoints
- **Request/Response DTOs**: API contracts with validation
- **Presentation Mappers**: Convert between layers
- **API Documentation**: Swagger annotations

## 🔄 Data Flow

```
HTTP Request → Controller → Presentation Mapper → Application Service → Use Case → Domain Logic
                ↓
HTTP Response ← Presentation Mapper ← Application DTO ← Use Case Result ← Domain Events
```

## 🚀 New vs Legacy

### 🆕 Clean Architecture (Use This!)

- **Service**: `UserApplicationServiceV2`
- **DTOs**: `application.dto.ts` (Commands/Queries)
- **Mappers**: `PresentationMapper`
- **Controller**: Uses V2 service and clean patterns

### 🔄 Legacy (Deprecated - Auth Module Only)

- **Service**: `UserApplicationService` (@deprecated)
- **DTOs**: `user.dto.ts` (with validation decorators)
- **Purpose**: Backward compatibility for Auth module

## 📋 Usage Examples

### Creating a User (Clean Architecture)

```typescript
// 1. Controller receives request
async createUser(@Body() createUserDto: CreateUserRequestDto) {
  // 2. Convert to application command
  const command = PresentationMapper.toCreateUserCommand(createUserDto);

  // 3. Execute via application service
  const result = await this.userApplicationService.createUser(command);

  // 4. Convert to presentation response
  const response = PresentationMapper.toUserResponseDto(result);
  return PresentationMapper.toApiSuccessResponse(response, 'User created');
}
```

### Domain Event Flow

```typescript
// 1. Domain Entity raises event
user.addDomainEvent(new UserCreatedEvent(user.id, user.email));

// 2. Use Case publishes events
await this.eventBus.publishAll(user.getDomainEvents());

// 3. Event handlers react
@EventHandler(UserCreatedEvent)
async handle(event: UserCreatedEvent) {
  // Send welcome email, create profile, etc.
}
```

## 🏗️ Implementation Guidelines

### ✅ DO

- Use Commands for write operations
- Use Queries for read operations
- Keep DTOs pure (no validation in application layer)
- Use dependency injection with interfaces
- Publish domain events from use cases
- Map between layer DTOs using dedicated mappers

### ❌ DON'T

- Put validation logic in domain entities
- Access infrastructure directly from domain
- Skip the application layer
- Mix presentation concerns with business logic
- Use legacy service for new features

## 🔧 Maintenance Notes

- **Legacy Service**: Will be removed after Auth module refactor
- **Migration Path**: Auth module should adopt UserApplicationServiceV2
- **Testing**: Each layer can be tested in isolation
- **Scalability**: Easy to add new features following established patterns

---

_Generated during Clean Architecture refactor - October 2025_
