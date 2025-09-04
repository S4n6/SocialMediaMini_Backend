import { Module } from '@nestjs/common';
import { FriendsService } from './follow.service';
import { FriendsController } from './follow.controller';

@Module({
  controllers: [FriendsController],
  providers: [FriendsService],
})
export class FriendsModule {}
