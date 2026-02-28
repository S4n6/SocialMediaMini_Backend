import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// ────────────────────────────────────────────────
// Request DTOs (class-validator for input validation)
// ────────────────────────────────────────────────

export class AddSearchEntryRequestDto {
  @ApiProperty({
    description: 'ID of the user being searched',
    example: 'user-uuid-123',
  })
  @IsNotEmpty()
  @IsString()
  searchedUserId: string;
}

// ────────────────────────────────────────────────
// Response DTOs (API shape)
// ────────────────────────────────────────────────

export class SearchedUserProfileDto {
  @ApiProperty({ example: 'user-uuid-123' })
  id: string;

  @ApiProperty({ example: 'johndoe' })
  userName: string;

  @ApiProperty({ example: 'John Doe' })
  fullName: string;

  @ApiProperty({
    example: 'https://cdn.example.com/avatar.jpg',
    nullable: true,
  })
  avatar: string | null;
}

export class SearchHistoryEntryResponseDto {
  @ApiProperty({ description: 'Entry ID', example: 'entry-uuid-123' })
  id: string;

  @ApiProperty({
    description: 'ID of the searched user',
    example: 'user-uuid-123',
  })
  searchedUserId: string;

  @ApiProperty({
    description: 'When the search was performed',
    example: '2025-10-01T10:00:00Z',
  })
  searchedAt: string;

  @ApiProperty({ description: 'Profile information of the searched user' })
  user: SearchedUserProfileDto;
}

export class SearchHistoryResponseDto {
  @ApiProperty({
    description: 'List of search history entries',
    type: [SearchHistoryEntryResponseDto],
  })
  history: SearchHistoryEntryResponseDto[];

  @ApiProperty({ description: 'Total number of entries', example: 5 })
  total: number;
}
