import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

export interface TokenRequest extends Request {
  accessToken?: string;
}

@Injectable()
export class TokenExtractionMiddleware implements NestMiddleware {
  use(req: TokenRequest, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // No token provided is OK - some endpoints don't require it
      // Vault endpoints will check for token separately
      return next();
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      throw new UnauthorizedException(
        'Invalid Authorization header format. Expected: Bearer <token>',
      );
    }

    const token = parts[1];

    // Validate token is not empty
    if (!token || token.trim() === '') {
      throw new UnauthorizedException('Authorization token is empty');
    }

    // Attach token to request for downstream handlers
    req.accessToken = token;

    next();
  }
}
