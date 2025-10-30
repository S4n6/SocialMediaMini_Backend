import {
  IsString,
  IsOptional,
  IsObject,
  IsNumber,
  MaxLength,
} from 'class-validator';

export class WebSocketEventDto {
  @IsString()
  @MaxLength(100)
  event: string;

  @IsObject()
  @IsOptional()
  payload?: any;

  @IsString()
  @IsOptional()
  requestId?: string;

  @IsNumber()
  @IsOptional()
  timestamp?: number;

  constructor(event: string, payload?: any, requestId?: string) {
    this.event = event;
    this.payload = payload;
    this.requestId = requestId;
    this.timestamp = Date.now();
  }
}

export class WebSocketAuthDto {
  @IsString()
  token: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  constructor(token: string, metadata?: Record<string, any>) {
    this.token = token;
    this.metadata = metadata;
  }
}
