import { IsString, IsOptional, IsArray } from 'class-validator';

export class JoinRoomDto {
  @IsString()
  roomId: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  constructor(
    roomId: string,
    password?: string,
    metadata?: Record<string, any>,
  ) {
    this.roomId = roomId;
    this.password = password;
    this.metadata = metadata;
  }
}

export class LeaveRoomDto {
  @IsString()
  roomId: string;

  constructor(roomId: string) {
    this.roomId = roomId;
  }
}

export class BroadcastToRoomDto {
  @IsString()
  roomId: string;

  @IsString()
  event: string;

  @IsOptional()
  payload?: any;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  excludeSocketIds?: string[];

  constructor(
    roomId: string,
    event: string,
    payload?: any,
    excludeSocketIds?: string[],
  ) {
    this.roomId = roomId;
    this.event = event;
    this.payload = payload;
    this.excludeSocketIds = excludeSocketIds;
  }
}
