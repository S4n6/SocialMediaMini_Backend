import { WebSocketErrorCode } from '../constants';

export class WebSocketResponseDto<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: WebSocketErrorCode;
    message: string;
    details?: any;
  };
  requestId?: string;
  timestamp: number;

  constructor(
    success: boolean,
    data?: T,
    error?: { code: WebSocketErrorCode; message: string; details?: any },
    requestId?: string,
  ) {
    this.success = success;
    this.data = data;
    this.error = error;
    this.requestId = requestId;
    this.timestamp = Date.now();
  }

  static success<T>(data?: T, requestId?: string): WebSocketResponseDto<T> {
    return new WebSocketResponseDto(true, data, undefined, requestId);
  }

  static error<T = any>(
    code: WebSocketErrorCode,
    message: string,
    details?: any,
    requestId?: string,
  ): WebSocketResponseDto<T> {
    return new WebSocketResponseDto<T>(
      false,
      undefined,
      { code, message, details },
      requestId,
    );
  }

  toJSON() {
    return {
      success: this.success,
      data: this.data,
      error: this.error,
      requestId: this.requestId,
      timestamp: this.timestamp,
    };
  }
}

export class WebSocketAckDto {
  acknowledged: boolean;
  requestId?: string;
  timestamp: number;

  constructor(acknowledged: boolean = true, requestId?: string) {
    this.acknowledged = acknowledged;
    this.requestId = requestId;
    this.timestamp = Date.now();
  }

  static create(requestId?: string): WebSocketAckDto {
    return new WebSocketAckDto(true, requestId);
  }
}
