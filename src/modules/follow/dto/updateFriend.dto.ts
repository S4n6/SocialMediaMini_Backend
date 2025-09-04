import { IsOptional, IsIn } from 'class-validator';

export class UpdateFriendDto {
  @IsOptional()
  @IsIn(['pending', 'accepted', 'blocked'], {
    message: 'Status must be one of: pending, accepted, blocked',
  })
  status?: string;
}