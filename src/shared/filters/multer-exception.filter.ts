import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Normalize exception shape and guard property access
    const ex = exception;

    // Detect Multer errors thrown by the multer middleware
    if (ex && typeof ex === 'object') {
      const maybe = ex as Record<string, unknown>;
      const code = typeof maybe.code === 'string' ? maybe.code : undefined;
      const message =
        typeof maybe.message === 'string' ? maybe.message : undefined;

      if (code === 'LIMIT_FILE_SIZE') {
        const msg = 'File too large. Max allowed size is 50 MB.';
        return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message: msg,
          error: 'PayloadTooLarge',
        });
      }

      if (code === 'LIMIT_UNEXPECTED_FILE') {
        const msg = 'Unexpected file field.';
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: msg,
          error: 'BadRequest',
        });
      }

      if (code || message) {
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message: message ?? 'File upload error',
          error: 'BadRequest',
        });
      }
    }

    // Not a Multer error — rethrow to let other filters/handlers deal with it
    throw exception;
  }
}
