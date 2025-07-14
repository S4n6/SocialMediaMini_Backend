import { IsUUID, IsNotEmpty } from 'class-validator';

export class CreateFriendDto {
  @IsUUID('4', { message: 'Friend ID must be a valid UUID' })
  @IsNotEmpty({ message: 'Friend ID is required' })
  friendId: string;
}