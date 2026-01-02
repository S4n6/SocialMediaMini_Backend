import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

/**
 * Request DTO for following a user
 */
export class FollowUserRequestDto {
  @IsUUID()
  userId: string;
}

/**
 * Query DTO for getting follows list
 */
export class GetFollowsQueryDto {
  @IsOptional()
  @IsUUID()
  followerId?: string;

  @IsOptional()
  @IsUUID()
  followingId?: string;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @IsOptional()
  @Transform(({ value }) => parseInt(value))
  @IsNumber()
  @Min(0)
  offset?: number = 0;
}
