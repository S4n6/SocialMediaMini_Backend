import { EntityNotFoundException } from '../../../../shared/exceptions/domain.exception';

export class StoryNotFoundException extends EntityNotFoundException {
  constructor(storyId: string) {
    super('Story', storyId);
  }
}
