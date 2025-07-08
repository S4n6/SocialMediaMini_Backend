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
