# Create Post Medias from URLs API

## Overview

This API endpoint allows you to create post media records from URLs provided by the client. You can create multiple post medias at once by providing an array of URLs.

## Endpoint

```
POST /post-medias/create-from-urls/{postId}
```

## Authentication

- Requires JWT token in Authorization header: `Bearer <token>`

## Request Body

```typescript
{
  "medias": [
    {
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg",
      "type": "image", // "image" | "video"
      "order": 1 // Optional: 1-10, auto-assigned if not provided
    },
    {
      "url": "https://res.cloudinary.com/example/video/upload/v1234567890/sample.mp4",
      "type": "video",
      "order": 2
    }
  ],
  "maxMediaPerPost": 10 // Optional: Default is 10, max is 10
}
```

## Path Parameters

- `postId` (string): The ID of the post to add medias to

## Response

```typescript
{
  "message": "Post medias created successfully from URLs",
  "data": [
    {
      "id": "uuid-1",
      "url": "https://res.cloudinary.com/example/image/upload/v1234567890/sample.jpg",
      "type": "image",
      "postId": "post-id-123",
      "order": 1,
      "createdAt": "2023-10-16T10:00:00.000Z",
      "updatedAt": "2023-10-16T10:00:00.000Z"
    }
  ],
  "totalCreated": 2
}
```

## Validation Rules

### Media URLs

- Must be valid URLs
- Each media object must have `url` and `type`
- Supported types: `"image"` or `"video"`
- Order is optional, must be between 1-10 if provided
- No duplicate orders allowed

### Limits

- Minimum 1 media URL required
- Maximum 10 media URLs per request
- Maximum 10 total medias per post (including existing ones)
- If `maxMediaPerPost` is provided, it must be between 1-10

### Order Assignment

- If no order is specified, medias will be assigned orders automatically
- Auto-assigned orders start after the highest existing order for the post
- Example: If post has 2 existing medias (orders 1,2), new medias will get orders 3,4,5...

## Error Responses

### 400 Bad Request

```typescript
{
  "message": "Too many media files",
  "error": "TOO_MANY_MEDIA_FILES"
}
```

```typescript
{
  "message": "Invalid URL format: invalid-url",
  "error": "INVALID_POST_MEDIA"
}
```

### 401 Unauthorized

```typescript
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Example Usage

### Create Single Media

```bash
curl -X POST \
  "http://localhost:3000/post-medias/create-from-urls/post-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medias": [
      {
        "url": "https://example.com/image.jpg",
        "type": "image"
      }
    ]
  }'
```

### Create Multiple Medias with Custom Orders

```bash
curl -X POST \
  "http://localhost:3000/post-medias/create-from-urls/post-123" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "medias": [
      {
        "url": "https://example.com/image1.jpg",
        "type": "image",
        "order": 1
      },
      {
        "url": "https://example.com/video1.mp4",
        "type": "video",
        "order": 2
      },
      {
        "url": "https://example.com/image2.jpg",
        "type": "image",
        "order": 3
      }
    ],
    "maxMediaPerPost": 5
  }'
```

## Integration with Frontend

This API is designed to work with the existing Cloudinary signature endpoint:

1. **Get Cloudinary signature**: `POST /post-medias/signature`
2. **Upload files to Cloudinary** using the signature (client-side)
3. **Create post medias** from the resulting URLs: `POST /post-medias/create-from-urls/{postId}`

This flow allows for secure, client-side uploads while maintaining server control over post media creation.
