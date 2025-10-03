import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUrl,
} from 'class-validator';

export class UploadPostMediaDto {
  @IsString()
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;
}

export class UpdatePostMediaDto {
  @IsOptional()
  @IsUrl({}, { message: 'URL must be a valid URL' })
  url?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Order must be a number' })
  @Min(1, { message: 'Order must be greater than 0' })
  order?: number;
}

export class ReorderPostMediaDto {
  @IsString()
  @IsNotEmpty({ message: 'Post ID is required' })
  postId: string;

  orders: Array<{
    id: string;
    order: number;
  }>;
}

export class GetPostMediasDto {
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  limit?: number = 20;
}

export class PostMediaResponseDto {
  id: string;
  url: string;
  type: string;
  postId: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export class PostMediaWithPostDto extends PostMediaResponseDto {
  post: {
    id: string;
    content: string;
    author: {
      id: string;
      userName: string;
      fullName: string;
      avatar: string;
    };
  };
}

export class PostMediaPaginationDto {
  items: PostMediaResponseDto[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export class CloudinarySignatureDto {
  signature: string;
  timestamp: number;
  folder: string;
  apiKey: string;
  cloudName: string;
}
