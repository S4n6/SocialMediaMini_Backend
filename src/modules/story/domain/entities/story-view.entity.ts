export class StoryViewEntity {
  constructor(
    public readonly id: string,
    public readonly storyId: string,
    public readonly viewerId: string,
    public readonly viewedAt: Date,
  ) {}

  /**
   * Create a new story view entity
   */
  static create(
    id: string,
    storyId: string,
    viewerId: string,
  ): StoryViewEntity {
    return new StoryViewEntity(id, storyId, viewerId, new Date());
  }
}
