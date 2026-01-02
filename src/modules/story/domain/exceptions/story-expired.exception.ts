import { BusinessRuleException } from '../../../../shared/exceptions/domain.exception';

export class StoryExpiredException extends BusinessRuleException {
  constructor(storyId: string) {
    super(`Story with ID ${storyId} has expired`, 'STORY_EXPIRED');
  }
}
