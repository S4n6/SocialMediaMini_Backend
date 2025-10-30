# WebSocket Architecture Documentation

## Overview

This WebSocket implementation follows Clean Architecture principles with a Modular Monolith pattern, providing a scalable foundation for real-time features across the entire application.

## Architecture Components

### Core Infrastructure

#### 1. **Constants** (`constants/`)

- `websocket-events.constant.ts` - All WebSocket event types
- `websocket-rooms.constant.ts` - Room naming conventions
- `websocket-errors.constant.ts` - Error messages and codes
- `websocket-config.constant.ts` - Configuration settings

#### 2. **Domain Layer** (`domain/`)

- `ConnectionEntity` - Connection state management
- `RoomEntity` - Room membership tracking

#### 3. **Application Layer** (`application/`)

- **Interfaces**: Service contracts and DTOs
- **Services**: Core business logic (ConnectionManager, RoomManager, Auth, etc.)

#### 4. **Infrastructure Layer** (`infrastructure/`)

- **Adapters**: Redis integration, external service adapters
- **Decorators**: WebSocket handler registration system

#### 5. **Presentation Layer** (`presentation/`)

- **Gateway**: Main WebSocket gateway handling connections
- **DTOs**: Data transfer objects with validation

## WebSocket Events

### Connection Events

- `connection` - New client connection
- `disconnect` - Client disconnection
- `error` - Connection errors

### Notification Events

- `notification:subscribe` - Subscribe to notifications
- `notification:unsubscribe` - Unsubscribe from notifications
- `notification:mark_read` - Mark notification as read
- `notification:mark_all_read` - Mark all notifications as read
- `notification:get_history` - Get notification history
- `notification:new` - New notification broadcast
- `notification:count_update` - Unread count update

### Posts Events

- `posts:subscribe` - Subscribe to post updates
- `posts:unsubscribe` - Unsubscribe from post updates
- `posts:subscribe_feed` - Subscribe to feed updates
- `posts:unsubscribe_feed` - Unsubscribe from feed updates
- `posts:react` - React to a post
- `posts:unreact` - Remove reaction from post
- `posts:add_comment` - Add comment to post
- `posts:new_post` - New post broadcast
- `posts:post_updated` - Post update broadcast
- `posts:post_deleted` - Post deletion broadcast
- `posts:reaction_update` - Reaction update broadcast
- `posts:new_comment` - New comment broadcast
- `posts:feed_update` - Feed update
- `posts:analytics` - Post analytics update

### Messaging Events

- `messaging:join_conversation` - Join conversation room
- `messaging:leave_conversation` - Leave conversation room
- `messaging:new_message` - Send new message
- `messaging:typing_start` - Start typing indicator
- `messaging:typing_stop` - Stop typing indicator
- `messaging:message_read` - Mark message as read
- `messaging:message_delivered` - Message delivery confirmation
- `messaging:conversation_updated` - Conversation updates
- `user:update_online_status` - Update online status

## Usage Guide

### For Frontend Development

#### 1. Connection Setup

```typescript
import { io } from 'socket.io-client';

const socket = io('ws://localhost:3000', {
  auth: {
    token: 'your-jwt-token',
  },
});
```

#### 2. Subscribe to Notifications

```typescript
// Subscribe to user notifications
socket.emit('notification:subscribe');

// Listen for new notifications
socket.on('notification:new', (notification) => {
  console.log('New notification:', notification);
});

// Listen for count updates
socket.on('notification:count_update', (data) => {
  console.log('Unread count:', data.count);
});
```

#### 3. Mark Notifications as Read

```typescript
// Mark single notification as read
socket.emit('notification:mark_read', {
  notificationId: 'notification-id',
});

// Mark all notifications as read
socket.emit('notification:mark_all_read');
```

#### 4. Get Notification History

```typescript
socket.emit('notification:get_history', {
  page: 1,
  limit: 20,
});

socket.on('notification:history', (data) => {
  console.log('Notifications:', data.notifications);
  console.log('Total:', data.total);
});
```

#### 5. Posts WebSocket Usage

##### Subscribe to Post Updates

```typescript
// Subscribe to specific post
socket.emit('posts:subscribe', {
  postId: 'post-uuid',
});

// Subscribe to feed
socket.emit('posts:subscribe_feed', {
  feedType: 'timeline', // 'timeline', 'explore', 'following'
  hashtags: ['#javascript', '#nestjs'],
});
```

##### React to Posts

```typescript
// React to post
socket.emit('posts:react', {
  postId: 'post-uuid',
  reactionType: 'LIKE', // 'LIKE', 'LOVE', 'LAUGH', 'ANGRY', 'SAD'
});

// Remove reaction
socket.emit('posts:unreact', {
  postId: 'post-uuid',
});

// Listen for reaction updates
socket.on('posts:reaction_update', (data) => {
  console.log('Reaction update:', data);
});
```

##### Add Comments

```typescript
// Add comment
socket.emit('posts:add_comment', {
  postId: 'post-uuid',
  content: 'Great post!',
  parentId: 'parent-comment-uuid', // Optional for replies
});

// Listen for new comments
socket.on('posts:new_comment', (comment) => {
  console.log('New comment:', comment);
});
```

##### Listen for Post Updates

```typescript
// New posts in feed
socket.on('posts:new_post', (post) => {
  console.log('New post in feed:', post);
});

// Post updates
socket.on('posts:post_updated', (post) => {
  console.log('Post updated:', post);
});

// Post deletions
socket.on('posts:post_deleted', (data) => {
  console.log('Post deleted:', data.postId);
});

// Feed updates
socket.on('posts:feed_update', (feedData) => {
  console.log('Feed updated:', feedData);
});
```

#### 6. Messaging WebSocket Usage

##### Join/Leave Conversations

```typescript
// Join a conversation
socket.emit('messaging:join_conversation', {
  conversationId: 'conversation-uuid',
});

// Leave a conversation
socket.emit('messaging:leave_conversation', {
  conversationId: 'conversation-uuid',
});

// Listen for conversation events
socket.on('conversation:user_joined', (data) => {
  console.log('User joined:', data.userName);
});

socket.on('conversation:user_left', (data) => {
  console.log('User left:', data.userName);
});
```

##### Send Messages

```typescript
// Send a text message
socket.emit('messaging:new_message', {
  conversationId: 'conversation-uuid',
  content: 'Hello, world!',
  type: 'TEXT',
  tempId: 'temp_123', // For optimistic updates
});

// Send media message
socket.emit('messaging:new_message', {
  conversationId: 'conversation-uuid',
  content: 'Check out this image!',
  type: 'IMAGE',
  attachmentUrls: ['https://example.com/image.jpg'],
});

// Reply to message
socket.emit('messaging:new_message', {
  conversationId: 'conversation-uuid',
  content: 'Great point!',
  type: 'TEXT',
  replyToMessageId: 'original-message-uuid',
});

// Listen for new messages
socket.on('messaging:new_message', (message) => {
  console.log('New message:', message);
});
```

##### Typing Indicators

```typescript
// Start typing
socket.emit('messaging:typing_start', {
  conversationId: 'conversation-uuid',
});

// Stop typing
socket.emit('messaging:typing_stop', {
  conversationId: 'conversation-uuid',
});

// Listen for typing indicators
socket.on('messaging:typing_start', (data) => {
  console.log(`${data.userName} is typing...`);
});

socket.on('messaging:typing_stop', (data) => {
  console.log(`${data.userName} stopped typing`);
});
```

##### Message Status & Read Receipts

```typescript
// Mark message as read
socket.emit('messaging:message_read', {
  messageId: 'message-uuid',
  readAt: new Date().toISOString(),
});

// Listen for delivery confirmations
socket.on('messaging:message_delivered', (data) => {
  console.log('Message delivered:', data.messageId);
});

// Listen for read receipts
socket.on('messaging:message_read', (data) => {
  console.log(`Message read by ${data.readerName}`);
});
```

##### Online Status

```typescript
// Update online status
socket.emit('user:update_online_status', {
  isOnline: true,
  lastSeenAt: new Date().toISOString(),
});

// Go offline
socket.emit('user:update_online_status', {
  isOnline: false,
});

// Listen for online status changes
socket.on('user:online_status_changed', (status) => {
  console.log(`${status.userId} is ${status.isOnline ? 'online' : 'offline'}`);
});
```

##### Conversation Updates

```typescript
// Listen for conversation updates
socket.on('messaging:conversation_updated', (update) => {
  switch (update.updateType) {
    case 'participant_added':
      console.log('New participant added');
      break;
    case 'title_changed':
      console.log('Conversation title changed');
      break;
    case 'settings_updated':
      console.log('Conversation settings updated');
      break;
  }
});
```

### For Backend Module Development

#### 1. Create Event Handlers

```typescript
// src/modules/your-module/application/handlers/your-handler.ts
import { BaseWebSocketHandler } from '../../../../shared/websocket/application/handlers/base.handler';

@WebSocketHandler('your_event')
export class YourEventHandler extends BaseWebSocketHandler<YourEventDto> {
  async handle(client: Socket, data: YourEventDto, user: User): Promise<void> {
    // Your event handling logic
  }
}
```

#### 2. Create DTOs

```typescript
// src/modules/your-module/application/dto/your-event.dto.ts
import { IsString, IsNotEmpty } from 'class-validator';

export class YourEventDto {
  @IsString()
  @IsNotEmpty()
  data: string;
}
```

#### 3. Register Handlers

```typescript
// src/modules/your-module/application/services/your-websocket-registration.service.ts
@Injectable()
export class YourWebSocketRegistrationService implements OnModuleInit {
  constructor(
    private readonly handlerRegistry: WebSocketHandlerRegistryService,
  ) {}

  async onModuleInit() {
    await this.handlerRegistry.registerHandler(YourEventHandler);
  }
}
```

#### 4. Create WebSocket Service

```typescript
// src/modules/your-module/application/services/your-websocket.service.ts
@Injectable()
export class YourWebSocketService {
  constructor(
    @Inject(forwardRef(() => MainWebSocketGateway))
    private readonly gateway: MainWebSocketGateway,
  ) {}

  async broadcastToUser(userId: string, event: string, data: any) {
    const room = WebSocketRooms.USER(userId);
    this.gateway.server.to(room).emit(event, data);
  }
}
```

## Configuration

### Environment Variables

```env
# WebSocket Configuration
WS_PORT=3000
WS_HEARTBEAT_INTERVAL=25000
WS_HEARTBEAT_TIMEOUT=60000
WS_MAX_CONNECTIONS_PER_USER=5

# Redis Configuration (for connection persistence)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

### Connection Limits

- Max connections per user: 5 (configurable)
- Heartbeat interval: 25 seconds
- Heartbeat timeout: 60 seconds
- Rate limiting: Applied per connection

## Testing

### Unit Tests

Run tests for individual handlers:

```bash
npm run test src/modules/notification/application/handlers
```

### Integration Tests

Test WebSocket functionality:

```bash
npm run test:e2e websocket
```

### Manual Testing with WebSocket Client

Use tools like:

- Postman WebSocket
- wscat CLI tool
- Browser DevTools

Example with wscat:

```bash
wscat -c ws://localhost:3000 -H "Authorization: Bearer your-jwt-token"
```

## Performance Considerations

### Scaling

- Uses Redis for connection state persistence
- Supports horizontal scaling with Redis adapter
- Connection pooling and load balancing ready

### Monitoring

- Health check endpoint available
- Connection metrics tracked
- Error monitoring integrated

### Security

- JWT authentication required
- Rate limiting per connection
- Input validation on all events
- CORS protection enabled

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if server is running on correct port
   - Verify JWT token is valid and not expired

2. **Events Not Received**
   - Ensure client is subscribed to correct room
   - Check if user authentication is working

3. **Memory Leaks**
   - Verify proper cleanup on disconnect
   - Check Redis connection pooling

### Debug Mode

Enable debug logging:

```env
DEBUG=socket.io:*
```

## Future Enhancements

### Phase 5: Messaging Module

- Real-time chat functionality
- Message delivery confirmation
- Typing indicators
- File sharing support

### Phase 6: Posts Module

- Real-time post updates
- Live reactions and comments
- Post collaboration features

### Phase 7: Advanced Features

- Video/voice calling
- Screen sharing
- Real-time collaborative editing
