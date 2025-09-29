import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AddSearchEntryDto {
  @ApiProperty({
    description: 'ID of the user being searched',
    example: 'user-uuid-123',
  })
  @IsNotEmpty()
  @IsString()
  searchedUserId: string;
}

export class SearchHistoryEntryDto {
  @ApiProperty({
    description: 'Entry ID',
    example: 'entry-uuid-123',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the searched user',
    example: 'user-uuid-123',
  })
  searchedUserId: string;

  @ApiProperty({
    description: 'When the search was performed',
    example: '2023-10-01T10:00:00Z',
  })
  searchedAt: string;

  @ApiProperty({
    description: 'Profile information of the searched user',
  })
  user: {
    id: string;
    userName: string;
    fullName: string;
    avatar: string | null;
  };
}

export class SearchHistoryResponseDto {
  @ApiProperty({
    description: 'List of search history entries',
    type: [SearchHistoryEntryDto],
  })
  history: SearchHistoryEntryDto[];

  @ApiProperty({
    description: 'Total number of search history entries',
    example: 5,
  })
  total: number;
}

export class SearchHistoryItemDto {
  @ApiProperty({
    description: 'ID of the searched user',
    example: 'user-uuid-123',
  })
  userId: string;

  @ApiProperty({
    description: 'When the user was searched',
    example: '2023-10-01T10:00:00Z',
  })
  searchedAt: string;

  @ApiProperty({
    description: 'Profile information of the searched user',
  })
  user: {
    id: string;
    userName: string;
    fullName: string;
    avatar: string | null;
  };
}
