import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { MulterError } from 'multer';

@Catch()
export class MulterExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Detect Multer errors thrown by the multer middleware
    if (exception instanceof MulterError || exception?.name === 'MulterError') {
      const code = exception.code;
      // Customize messages per Multer error code
      if (code === 'LIMIT_FILE_SIZE') {
        const message = 'File too large. Max allowed size is 50 MB.';
        return response.status(HttpStatus.PAYLOAD_TOO_LARGE).json({
          statusCode: HttpStatus.PAYLOAD_TOO_LARGE,
          message,
          error: 'PayloadTooLarge',
        });
      }

      if (code === 'LIMIT_UNEXPECTED_FILE') {
        const message = 'Unexpected file field.';
        return response.status(HttpStatus.BAD_REQUEST).json({
          statusCode: HttpStatus.BAD_REQUEST,
          message,
          error: 'BadRequest',
        });
      }

      // Generic multer error fallback
      const fallbackMessage = exception.message || 'File upload error';
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: fallbackMessage,
        error: 'BadRequest',
      });
    }

    // Not a Multer error — rethrow to let other filters/handlers deal with it
    throw exception;
  }
}
