import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private logger = new Logger('HTTP');

  use(request: Request, response: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    // Log request
    this.logger.log(
      `→ ${method} ${originalUrl} - ${ip} - ${userAgent.substring(0, 50)}`,
    );

    // Capture response
    response.on('finish', () => {
      const { statusCode } = response;
      const duration = Date.now() - startTime;
      const statusEmoji = statusCode >= 400 ? '❌' : '✅';

      this.logger.log(
        `${statusEmoji} ${method} ${originalUrl} - ${statusCode} - ${duration}ms`,
      );
    });

    next();
  }
}
