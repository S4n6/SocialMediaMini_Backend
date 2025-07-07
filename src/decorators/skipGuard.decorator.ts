import { SetMetadata } from '@nestjs/common';

export const SKIP_GUARDS_KEY = 'skipGuards';
export const SkipGuards = () => SetMetadata(SKIP_GUARDS_KEY, true);