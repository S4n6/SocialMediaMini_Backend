export class StoryEntity {
  constructor(
    public readonly id: string,
    public readonly authorId: string,
    public readonly content: string | null,
    public readonly mediaUrl: string | null,
    public readonly mediaType: string | null,
    public readonly expiresAt: Date,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
  ) {}

  /**
   * Check if the story has expired
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if the story is viewable (active and not expired)
   */
  public isViewable(): boolean {
    return this.isActive && !this.isExpired();
  }

  /**
   * Get the story type based on content
   */
  public getStoryType(): 'text' | 'image' | 'mixed' {
    if (this.mediaUrl && this.content) {
      return 'mixed';
    } else if (this.mediaUrl) {
      return 'image';
    } else {
      return 'text';
    }
  }

  /**
   * Create a new story entity
   */
  static create(
    id: string,
    authorId: string,
    content: string | null,
    mediaUrl: string | null,
    mediaType: string | null,
  ): StoryEntity {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now

    return new StoryEntity(
      id,
      authorId,
      content,
      mediaUrl,
      mediaType,
      expiresAt,
      true, // isActive
      now, // createdAt
      now, // updatedAt
    );
  }
}
