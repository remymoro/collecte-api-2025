// src/common/filters/global-exception.filter.ts
import {
  ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    Logger.error('Exception attrapée par le filtre global:', exception);
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    const requestId = req.headers['x-request-id'] ?? randomUUID();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse() as any;
      // On n’écrase pas, on complète seulement.
      return res.status(status).json({
        ...((typeof body === 'string') ? { message: body } : body),
        statusCode: body?.statusCode ?? status,
        timestamp: new Date().toISOString(),
        path: req.originalUrl ?? req.url,
        requestId,
      });
    }

    // Fallback 500
    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    return res.status(status).json({
      statusCode: status,
      error: 'Internal Server Error',
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl ?? req.url,
      requestId,
      ...(process.env.NODE_ENV === 'development' && { stack: (exception as any)?.stack }),
    });
  }
}
