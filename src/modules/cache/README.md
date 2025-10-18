# Cache Module - Fresher Version

Đây là phiên bản đơn giản của Cache Module, phù hợp cho fresher level.

## Cấu trúc Module

```
cache/
├── cache.module.ts       # Module configuration
├── cache.service.ts      # Core cache service
├── cache.interfaces.ts   # Type definitions và configs
├── cache.utils.ts        # Utility methods cho use cases thường gặp
└── README.md            # Hướng dẫn này
```

## Cách sử dụng

### 1. Import Module

Module đã được config sẵn trong `cache.module.ts`. Chỉ cần import vào module cần sử dụng:

```typescript
import { RedisCacheModule } from './modules/cache/cache.module';

@Module({
  imports: [RedisCacheModule],
  // ...
})
export class YourModule {}
```

### 2. Inject Service

```typescript
import { RedisCacheService, CacheUtils } from './modules/cache';

@Injectable()
export class YourService {
  constructor(
    private readonly cacheService: RedisCacheService,
    private readonly cacheUtils: CacheUtils,
  ) {}
}
```

### 3. Sử dụng Basic Cache Methods

```typescript
// Lưu cache
await this.cacheService.set('key', data, 3600); // TTL = 1 giờ

// Lấy cache
const data = await this.cacheService.get('key');

// Xóa cache
await this.cacheService.del('key');

// Lấy hoặc set (nếu không có trong cache)
const data = await this.cacheService.getOrSet(
  'key',
  async () => {
    // Function để fetch data mới
    return await this.fetchDataFromDB();
  },
  3600, // TTL
);
```

### 4. Sử dụng Utils cho Use Cases thường gặp

```typescript
// User Profile
await this.cacheUtils.cacheUserProfile(userId, userData);
const profile = await this.cacheUtils.getCachedUserProfile(userId);
await this.cacheUtils.invalidateUserProfile(userId);

// Posts
await this.cacheUtils.cachePost(postId, postData);
const post = await this.cacheUtils.getCachedPost(postId);
await this.cacheUtils.invalidatePost(postId);

// User Feed
await this.cacheUtils.cacheUserFeed(userId, feedData, page);
const feed = await this.cacheUtils.getCachedUserFeed(userId, page);
await this.cacheUtils.invalidateUserFeed(userId);

// Search Results
await this.cacheUtils.cacheSearchResults(query, results, 'users');
const results = await this.cacheUtils.getCachedSearchResults(query, 'users');

// Notifications
await this.cacheUtils.cacheUserNotifications(userId, notifications);
const notifications = await this.cacheUtils.getCachedUserNotifications(userId);
```

## Cache Configs có sẵn

Đã có sẵn các config cho:

- `USER_PROFILE`: 30 phút TTL
- `POST`: 10 phút TTL
- `USER_FEED`: 5 phút TTL
- `SEARCH`: 10 phút TTL
- `NOTIFICATIONS`: 3 phút TTL

## Best Practices

1. **Key Naming**: Utils tự động tạo key với prefix để tránh conflict
2. **TTL**: Sử dụng TTL phù hợp - data ít thay đổi có thể cache lâu hơn
3. **Invalidation**: Nhớ xóa cache khi data thay đổi
4. **Error Handling**: Service đã handle errors, trả về null khi có lỗi

## Ví dụ thực tế

### Cache User Profile trong User Service

```typescript
@Injectable()
export class UserService {
  constructor(
    private readonly cacheUtils: CacheUtils,
    private readonly userRepository: UserRepository,
  ) {}

  async getUserProfile(userId: string) {
    // Thử lấy từ cache trước
    const cached = await this.cacheUtils.getCachedUserProfile(userId);
    if (cached) {
      return cached;
    }

    // Nếu không có, query từ DB
    const profile = await this.userRepository.findById(userId);

    // Cache lại cho lần sau
    await this.cacheUtils.cacheUserProfile(userId, profile);

    return profile;
  }

  async updateUserProfile(userId: string, updateData: any) {
    // Update trong DB
    const updated = await this.userRepository.update(userId, updateData);

    // Xóa cache cũ
    await this.cacheUtils.invalidateUserProfile(userId);

    return updated;
  }
}
```

## Lưu ý về Config

- **TTL mặc định**: 1 giờ (3600 giây)
- **Redis URL**: Lấy từ `REDIS.URL` config
- **Không sử dụng Memory cache**: Chỉ dùng Redis để đơn giản
- **lruSize, compress**: Đã bỏ để giảm complexity

## Troubleshooting

1. **Cache miss liên tục**: Kiểm tra Redis connection
2. **Memory issues**: TTL quá dài hoặc cache quá nhiều data
3. **Data stale**: TTL quá dài, cần giảm hoặc manual invalidate
