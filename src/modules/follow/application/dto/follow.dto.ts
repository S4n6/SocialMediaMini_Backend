import { IsUUID, IsNotEmpty, IsOptional } from 'class-validator';

export class FollowUserDto {
  @IsUUID('4', { message: 'User ID must be a valid UUID' })
  @IsNotEmpty({ message: 'User ID is required' })
  userId: string;
}

export class GetFollowsQuery {
  @IsOptional()
  @IsUUID()
  followerId?: string;

  @IsOptional()
  @IsUUID()
  followingId?: string;
}
