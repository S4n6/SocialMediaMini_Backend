# Timeline Algorithm Implementation

## 📋 Overview

Đã triển khai hệ thống **Timeline Algorithm** với 3 thuật toán khác nhau để cải thiện trải nghiệm người dùng khi xem feed.

## 🚀 Architecture

```
TimelineService
├── ITimelineRepository (Interface)
├── PostPrismaRepository (Basic chronological)
└── AdvancedTimelineRepository (Smart + Diversified)
```

## 🎯 Algorithms Available

### 1. **Chronological** (Default)

- ✅ **Đơn giản, nhanh**: Pure database pagination
- ✅ **Timeline tự nhiên**: Sắp xếp theo thời gian tạo
- ✅ **Performance tốt**: Tận dụng DB indexes
- 🎯 **Use case**: Default feed, real-time timeline

### 2. **Smart** (AI-powered)

- 🧠 **Ranking algorithm**: Tương tự Facebook/Instagram
- 📊 **Factors**:
  - `Engagement Score` (30%): likes + comments + shares
  - `Recency Score` (40%): Ưu tiên posts mới (24h)
  - `Relationship Score` (20%): Tương tác với author
  - `Content Score` (10%): Media, content length
- 🎯 **Use case**: Personalized feed, high engagement

### 3. **Diversified**

- 🎭 **Variety**: Giới hạn posts liên tiếp cùng author
- ⚖️ **Balanced timeline**: Max 2 posts/author per page
- 🎯 **Use case**: Khám phá nội dung đa dạng

## 🛠️ Usage

### API Endpoint

```http
GET /posts/feed/timeline?algorithm=smart&page=1&limit=10
```

### Parameters

```typescript
interface GetTimelineFeedDto {
  page?: number = 1;
  limit?: number = 10;
  algorithm?: 'chronological' | 'smart' | 'diversified' = 'chronological';
}
```

### Response

```json
{
  "posts": [...],
  "total": 150,
  "page": 1,
  "limit": 10,
  "totalPages": 15,
  "hasNextPage": true,
  "hasPreviousPage": false
}
```

## 📊 Performance Comparison

| Algorithm         | Performance  | UX Quality   | Scalability | Complexity |
| ----------------- | ------------ | ------------ | ----------- | ---------- |
| **Chronological** | 🟢 Excellent | 🟡 Good      | 🟢 High     | 🟢 Simple  |
| **Smart**         | 🟡 Good      | 🟢 Excellent | 🟡 Medium   | 🔴 Complex |
| **Diversified**   | 🟢 Good      | 🟢 Very Good | 🟢 High     | 🟡 Medium  |

## 🔧 Configuration

### Switch Algorithm Implementation

```typescript
// In posts.module.ts
{
  provide: TIMELINE_REPOSITORY_TOKEN,
  useClass: AdvancedTimelineRepository, // Smart + Diversified
  // Alternative: useClass: PostPrismaRepository, // Basic chronological only
}
```

### Ranking Weights (Smart Algorithm)

```sql
-- Customize in advanced-timeline.repository.ts
final_score = (
  engagement_score * 0.3 +  -- Interaction weight
  recency_score * 0.4 +     -- Time decay weight
  relationship_score * 0.2 + -- Social connection weight
  content_score * 0.1       -- Content quality weight
)
```

## 💡 Examples

### Basic Usage

```typescript
// Service usage
const timeline = await timelineService.getTimelineFeed(
  userId: "123",
  page: 1,
  limit: 10,
  algorithm: "chronological"
);
```

### Advanced Usage with Caching

```typescript
// Cached with different keys per algorithm
GET /posts/feed/timeline?algorithm=smart    // Cache key: timeline_feed:123:page:1:limit:10:algo:smart
GET /posts/feed/timeline?algorithm=chronological // Cache key: timeline_feed:123:page:1:limit:10:algo:chronological
```

## 🐛 Troubleshooting

### Common Issues

1. **Smart algorithm slow?**
   - Check database indexes on: `created_at`, `author_id`, `follower_id`
   - Consider reducing ranking calculation complexity

2. **Cache invalidation?**
   - Timeline cache keys include algorithm parameter
   - New posts automatically invalidate related cache

3. **Memory usage high?**
   - Smart algorithm uses raw SQL to avoid ORM overhead
   - Diversified algorithm limits results per author

## 🔮 Future Enhancements

- [ ] **Machine Learning**: Personalization based on user behavior
- [ ] **A/B Testing**: Compare algorithm effectiveness
- [ ] **Real-time updates**: WebSocket feed updates
- [ ] **Content filtering**: Hide/promote specific content types
- [ ] **Trending topics**: Integrate hashtag trends into ranking

## 📚 Related Files

```
src/modules/posts/
├── application/
│   ├── interfaces/timeline-repository.interface.ts
│   └── services/timeline.service.ts
├── infrastructure/
│   ├── post.prisma.repository.ts (Basic)
│   └── advanced-timeline.repository.ts (Smart + Diversified)
└── presentation/posts.controller.ts
```
