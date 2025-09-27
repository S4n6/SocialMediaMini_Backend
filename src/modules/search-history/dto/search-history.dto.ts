import { IsString, IsNotEmpty, IsDateString, IsUUID } from 'class-validator';

export class UserInfoDto {
  @IsString()
  id: string;

  @IsString()
  userName: string;

  @IsString()
  fullName: string;

  avatar?: string;
}

export class SearchHistoryItemDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsDateString()
  searchedAt: string;

  user?: UserInfoDto;
}

export class AddSearchHistoryDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  searchedUserId: string;
}

export class SearchHistoryResponseDto {
  history: SearchHistoryItemDto[];
  total: number;
}
