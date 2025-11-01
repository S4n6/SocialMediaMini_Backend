import { ForbiddenException } from '../../../../shared/exceptions/domain.exception';

export class StoryAccessDeniedException extends ForbiddenException {
  constructor(storyId: string) {
    super(`Access denied to story with ID ${storyId}`, 'STORY_ACCESS_DENIED');
  }
}
