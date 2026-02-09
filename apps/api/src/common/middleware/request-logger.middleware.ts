import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Logger Middleware
 * 
 * Logs all HTTP requests in production format:
 * - Timestamp
 * - Method
 - URL
 * - Status code
 * - Response time
 * - User ID (if authenticated)
 * - IP address
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const start = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const userId = (req as any).user?.userId || 'anonymous';

    // Log request start
    this.logger.log(`→ ${method} ${originalUrl} - User: ${userId} - IP: ${ip}`);

    // Capture response finish
    res.on('finish', () => {
      const duration = Date.now() - start;
      const statusCode = res.statusCode;
      const statusMessage = this.getStatusMessage(statusCode);

      this.logger.log(
        `← ${method} ${originalUrl} ${statusCode} ${statusMessage} - ${duration}ms - User: ${userId}`,
      );
    });

    next();
  }

  private getStatusMessage(statusCode: number): string {
    if (statusCode >= 500) return '🔴 ERROR';
    if (statusCode >= 400) return '🟡 WARNING';
    if (statusCode >= 300) return '🔵 REDIRECT';
    return '🟢 SUCCESS';
  }
}
