# 🔧 Module Refactoring Checklist

A 6-phase checklist for refactoring any module to Clean Architecture + DDD standards.  
Apply phases in order — each builds on the previous one.

---

## Phase 1: Domain Layer Purity

> **Goal:** Domain has zero framework imports and encapsulates all business logic.

- [ ] **Rich Entities** — All business rules live inside entity methods (no anemic models)
- [ ] **Value Objects** — Email, Password, UserId etc. are immutable VOs with validation
- [ ] **Domain Exceptions** — Custom exception hierarchy (`DomainException` → `BusinessRuleException`, `ValidationException`, etc.)
- [ ] **Repository Interfaces** — `i-[name].repository.ts` with `save()`, `findById()`, `delete()` only (no `update(id, partial)`)
- [ ] **Domain Events** — Rich event classes emitted by entities (e.g., `UserRegisteredEvent`)
- [ ] **No Framework Imports** — Zero `@nestjs/*`, `@prisma/*`, or other framework references in domain

**Anti-patterns to check:**
- ❌ `import { Injectable } from '@nestjs/common'` in domain
- ❌ Generic `update(id, partial)` in repository interfaces
- ❌ Business rules in services instead of entities

---

## Phase 2: Application Layer Hygiene

> **Goal:** Use cases are single-responsibility, side effects go to subscribers.

- [ ] **Single Use Case per File** — `[verb]-[noun].use-case.ts` naming
- [ ] **No Direct Infra** — Use cases only depend on domain interfaces and ports
- [ ] **Application DTOs** — Typed commands/queries (no `any`, no raw Prisma types)
- [ ] **No Dead Methods** — Remove unused DTO-returning wrappers and legacy compatibility
- [ ] **Event Subscribers** — Side effects (email, cache, notifications) handled via `@OnEvent()`
- [ ] **Application Service** — Thin orchestrator that delegates to use cases (no business logic)

**Anti-patterns to check:**
- ❌ `as unknown as SomeDto` — indicates wrong typing somewhere
- ❌ Duplicate method groups (DTO-returning + Entity-returning for same operation)
- ❌ Business logic in application service instead of use cases

---

## Phase 3: Infrastructure Layer Correctness

> **Goal:** Infrastructure implements domain interfaces faithfully, with proper mappers.

- [ ] **Repository Implementations** — Implement domain interfaces using Prisma, with `upsert`-based `save()`
- [ ] **Mappers** — Dedicated `[entity].mapper.ts` for Domain Entity ↔ Prisma Model conversion
- [ ] **No Skeleton Classes** — Delete all `throw new Error('Method not implemented')` stubs
- [ ] **Cross-Module Adapters** — Use explicit enum/type mapping (no `as any` for role conversion etc.)
- [ ] **Ports Implementation** — All application ports (`i-[name].service.ts`) have concrete adapters
- [ ] **No Raw Prisma in Domain** — All Prisma access goes through repository + mapper

**Anti-patterns to check:**
- ❌ `as any` for type conversion between bounded contexts
- ❌ Dead adapter files with unimplemented methods
- ❌ Direct `prisma.model.findMany()` calls outside infrastructure layer

---

## Phase 4: Presentation Layer Robustness

> **Goal:** Controllers handle HTTP concerns only, with proper error mapping.

- [ ] **Error Mapping** — Use `instanceof DomainException` (not `error.message.includes(...)`)
- [ ] **Presentation DTOs** — `class-validator` decorated DTOs for input, response DTOs for output
- [ ] **Presentation Mapper** — Converts between application DTOs and presentation DTOs
- [ ] **Auth Guards** — Proper ownership checks (`req.user.id === param.id`)
- [ ] **No Business Logic** — Controllers delegates everything to application service
- [ ] **Swagger Decorators** — All endpoints have `@ApiOperation`, `@ApiResponse`, `@ApiParam`

**Anti-patterns to check:**
- ❌ `error.message.includes('some string')` for error handling
- ❌ Business rules or validation in controllers
- ❌ Missing ownership/authorization checks

---

## Phase 5: DI Wiring & Module Configuration

> **Goal:** Clean dependency injection with no dead tokens or aliases.

- [ ] **DI Tokens** — All in `[module].constants.ts` with `SCREAMING_SNAKE_CASE`
- [ ] **No Dead Tokens** — Remove unused/legacy DI tokens and provider aliases
- [ ] **Module Exports** — Only export what other modules actually need (classes + tokens)
- [ ] **No Dual Providers** — One class per responsibility (no `LegacyXxxService` + `XxxService`)
- [ ] **Cross-Module Imports** — Use `forwardRef()` or proper module imports (not direct file imports)
- [ ] **Provider Registration** — All use cases, repositories, adapters registered as providers

**Anti-patterns to check:**
- ❌ `LEGACY_*` token constants
- ❌ Multiple providers resolving to the same class
- ❌ Barrel exports (`index.ts`) exporting dead code

---

## Phase 6: Testing & Validation

> **Goal:** Confidence that the refactored module works correctly.

- [ ] **Domain Unit Tests** — Entities, value objects, factories, domain services
- [ ] **Use Case Unit Tests** — With mocked repositories and ports
- [ ] **Mapper Tests** — Complex transformations between bounded contexts
- [ ] **All Existing Tests Pass** — Run full suite with `npx jest --maxWorkers=1 --forceExit`
- [ ] **No TypeScript Errors** — `npx tsc --noEmit` passes cleanly
- [ ] **Manual Smoke Test** — Key API endpoints still work end-to-end

**Coverage Targets (by layer):**
- Domain: 80-90%
- Application: 60-70%  
- Infrastructure: 30-40% (complex mappers only)
- Presentation: 20-30% (via E2E tests)

---

## Quick Reference

| Phase | Focus | Key Question |
|-------|-------|-------------|
| 1 | Domain | Are entities rich and framework-free? |
| 2 | Application | Are use cases clean and side-effect-free? |
| 3 | Infrastructure | Are all interfaces implemented faithfully? |
| 4 | Presentation | Are errors mapped via `instanceof`? |
| 5 | DI Wiring | Are there dead tokens or duplicate providers? |
| 6 | Testing | Do all tests pass? |
