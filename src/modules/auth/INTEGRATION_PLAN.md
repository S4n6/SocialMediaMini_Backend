# Auth Module - Users Module Integration Plan

## 🏗️ Current Architecture (Hybrid Approach)

### ✅ **What We've Achieved:**

- Auth Domain keeps its own `IUserRepository` interface
- `AuthUserRepository` adapter created for future Users module integration
- Clean separation of concerns maintained
- Auth module compiles successfully

### 🔄 **Integration Steps (Future Implementation):**

#### **Phase 1: Users Module Integration**

1. **Add Users Module Dependency:**

   ```typescript
   // auth.module.ts
   imports: [
     UsersModule, // Import Users module
   ];
   ```

2. **Update AuthUserRepository Constructor:**

   ```typescript
   constructor(
     @Inject('USERS_REPOSITORY_TOKEN')
     private readonly usersRepository: UserPrismaRepository
   ) {}
   ```

3. **Implement Mapping Methods:**
   - `mapAuthUserToUsersUser()` - Convert Auth User to Users User
   - `mapUsersUserToAuthUser()` - Convert Users User to Auth User

#### **Phase 2: Method Implementation**

Replace throw errors with actual implementations:

```typescript
async findById(id: string): Promise<AuthUser | null> {
  const usersUser = await this.usersRepository.findById(new UserId(id));
  return usersUser ? this.mapUsersUserToAuthUser(usersUser) : null;
}

async create(user: AuthUser): Promise<AuthUser> {
  const usersUser = this.mapAuthUserToUsersUser(user);
  await this.usersRepository.save(usersUser);
  return user;
}

// ... implement other methods
```

#### **Phase 3: Entity Mapping Logic**

```typescript
private mapUsersUserToAuthUser(usersUser: UsersUser): AuthUser {
  return AuthUser.fromPersistence({
    id: usersUser.id,
    email: new Email(usersUser.email),
    username: usersUser.username,
    fullName: usersUser.profile.displayName,
    hashedPassword: usersUser.passwordHash || '',
    role: this.mapRole(usersUser.role),
    isEmailVerified: usersUser.isEmailVerified,
    emailVerifiedAt: usersUser.emailVerifiedAt,
    avatar: usersUser.profile.avatar || null,
    createdAt: usersUser.createdAt,
    updatedAt: usersUser.updatedAt,
    lastLoginAt: null,
  });
}
```

## 🎯 **Benefits of This Approach:**

1. **🔵 Domain Independence**: Auth domain remains isolated
2. **🔄 Code Reuse**: Infrastructure leverages Users module
3. **🧪 Easy Testing**: Auth interface can be mocked independently
4. **📦 Module Boundaries**: Clear separation between contexts
5. **🚀 Gradual Migration**: Can implement integration step by step

## 🛠️ **Current Status:**

- ✅ Auth domain interfaces created
- ✅ AuthUserRepository adapter skeleton ready
- ✅ DI configuration updated
- ✅ TypeScript compilation successful
- ⏳ Users module integration pending (future work)

## 📝 **Notes:**

- All methods currently throw "not implemented" errors
- This prevents runtime errors while maintaining compile-time safety
- Integration can be done incrementally without breaking existing code
- Auth module maintains its own bounded context
