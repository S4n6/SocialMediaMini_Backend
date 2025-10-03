# Repository Architecture Guide

## Vấn đề ban đầu

Bạn đã có 2 repository interfaces khác nhau:

1. `auth/application/interfaces/user-repository.interface.ts` - Cho auth module
2. `users/domain/repositories/user.repository.interface.ts` - Cho users module

Và băn khoăn có nên tạo repository riêng hay tái sử dụng repository của users module.

## Giải pháp đã áp dụng: Tái sử dụng Users Repository (Khuyến nghị)

### Ưu điểm:

- **DRY Principle**: Không duplicate code
- **Single Source of Truth**: Chỉ có 1 nơi xử lý User data
- **Consistency**: Đảm bảo tất cả operations trên User entity được handle giống nhau
- **Maintainability**: Dễ maintain và update

### Thay đổi đã thực hiện:

#### 1. Cập nhật Auth Register UseCase

```typescript
// Trước - Tự tạo object đơn giản
const newUser = await this.userRepository.save({
  username,
  email,
  fullName,
  role: ROLES.USER,
  isEmailVerified: false,
  // ...
});

// Sau - Sử dụng UserFactory từ Users module
const newUser = await UserFactory.createUser({
  username,
  email,
  password,
  profile: {
    fullName,
    avatar,
  },
});

await this.userRepository.save(newUser);
```

#### 2. Import dependencies từ Users module

```typescript
import { UserFactory } from '../../../users/domain/factories/user.factory';
import { IUserRepository } from 'src/modules/users/application';
```

#### 3. Cập nhật Auth Module để sử dụng shared repository

```typescript
@Module({
  imports: [
    forwardRef(() => UsersModule), // Import UsersModule
    // ...
  ],
  // Không cần tự define USER_REPOSITORY_TOKEN, sử dụng từ UsersModule
})
```

## Cách sử dụng Repository pattern đúng:

### 1. Tạo User Entity sử dụng Factory

```typescript
// Trong UseCase
const newUser = await UserFactory.createUser({
  username: 'john_doe',
  email: 'john@example.com',
  password: 'hashedPassword',
  profile: {
    fullName: 'John Doe',
    avatar: 'avatar_url',
    bio: 'Developer',
  },
});
```

### 2. Lưu Entity

```typescript
// Save entity (sẽ create hoặc update tùy theo entity đã tồn tại chưa)
await this.userRepository.save(newUser);
```

### 3. Query Entity

```typescript
// Find by string values (không phải value objects)
const user = await this.userRepository.findByEmail('john@example.com');
const user2 = await this.userRepository.findByUsername('john_doe');
```

## Kiến trúc Module Dependencies:

```
AuthModule
  ↓ imports
UsersModule (provides USER_REPOSITORY_TOKEN, UserFactory)
  ↓ uses
UserPrismaRepository (implements IUserRepository)
  ↓ uses
PrismaService (database access)
```

## Best Practices:

### 1. ✅ DO: Sử dụng Factory cho entity creation

```typescript
const user = await UserFactory.createUser(userData);
```

### 2. ✅ DO: Sử dụng Repository interface cho data access

```typescript
constructor(
  @Inject(USER_REPOSITORY_TOKEN)
  private userRepository: IUserRepository,
) {}
```

### 3. ✅ DO: Handle domain logic trong entities/value objects

```typescript
// Entity sẽ có các method như:
user.updateProfile(newProfile);
user.verifyEmail();
user.changePassword(newPassword);
```

### 4. ❌ DON'T: Truyền raw objects vào repository

```typescript
// Sai
await repository.save({ email: '...', username: '...' });

// Đúng
await repository.save(userEntity);
```

### 5. ❌ DON'T: Tạo duplicate repository cho cùng entity

Thay vào đó, extend hoặc tái sử dụng existing repository.

## Verification Token Issue:

Hiện tại UserFactory chưa support verification token. Có 2 cách xử lý:

### Option 1: Extend UserFactory

Thêm method `createUnverifiedUser()` vào UserFactory.

### Option 2: Handle verification sau khi tạo user

```typescript
const user = await UserFactory.createUser(userData);
// Set verification token through user method
user.setVerificationToken(verificationToken);
await this.userRepository.save(user);
```

## Tóm tắt:

✅ **Đã giải quyết**: Tái sử dụng Users Repository thay vì tạo duplicate
✅ **Đã sử dụng**: UserFactory cho proper entity creation  
✅ **Đã đảm bảo**: Consistent architecture across modules
✅ **Đã xóa**: Auth module's duplicate user repository files
✅ **Đã tạo**: AuthUserService làm bridge giữa auth requirements và users repository
⚠️ **Cần bổ sung**: Verification token handling trong User entity

## Files đã xóa:

- `auth/application/interfaces/user-repository.interface.ts`
- `auth/infrastructure/user-management.repository.ts`

## Files đã tạo:

- `auth/application/auth-user.service.ts` - Service wrapper cho auth-specific operations

## Architecture sau cleanup:

```
AuthModule
├── Use Cases (login, register, verify-email, etc.)
├── AuthUserService (bridge service)
│   └── Uses Users Repository + Prisma for auth operations
└── Strategies (JWT, Google)
    └── Uses AuthUserService

UsersModule
├── Domain (entities, value objects, factory)
├── Repository (IUserRepository interface + implementation)
└── Exports: USER_REPOSITORY_TOKEN, UserFactory
```
