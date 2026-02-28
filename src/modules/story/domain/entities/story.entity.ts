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
   * Check if the story has expired based on expiresAt timestamp
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
   * Mark the story as expired/inactive.
   * Returns a new StoryEntity with isActive = false (immutable pattern).
   */
  public markExpired(): StoryEntity {
    if (!this.isActive) {
      return this;
    }

    return new StoryEntity(
      this.id,
      this.authorId,
      this.content,
      this.mediaUrl,
      this.mediaType,
      this.expiresAt,
      false,
      this.createdAt,
      new Date(),
    );
  }

  /**
   * Get the story type based on content and media
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
   * Factory method — create a new story entity
   */
  static create(
    id: string,
    authorId: string,
    content: string | null,
    mediaUrl: string | null,
    mediaType: string | null,
  ): StoryEntity {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours

    return new StoryEntity(
      id,
      authorId,
      content,
      mediaUrl,
      mediaType,
      expiresAt,
      true,
      now,
      now,
    );
  }
}
