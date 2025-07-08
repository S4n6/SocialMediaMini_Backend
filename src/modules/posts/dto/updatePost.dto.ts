export class UpdatePostDto {
  content?: string;
  mediaUrls?: [
    {
      url: string;
      type: 'image' | 'video';
    },
  ];
}
