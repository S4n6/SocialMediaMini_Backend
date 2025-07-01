export class CreatePostDto {
  content: string;
  authorId: string;
  mediaUrls?: [
    {
      url: string;
      type: 'image' | 'video';
    },
  ];
}

export class UpdatePostDto {
  content?: string;
  mediaUrls?: [
    {
      url: string;
      type: 'image' | 'video';
    },
  ];
}

export interface PostResponse {
  id: string;
  content: string;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
}
