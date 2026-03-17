import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from './token.service';

export interface VaultRequest extends Request {
  tokenContext?: {
    userId: string;
    appId: string;
    approvedFields: string[];
  };
  accessToken?: string;
}

@Injectable()
export class TokenValidationGuard implements CanActivate {
  constructor(private tokenService: TokenService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<VaultRequest>();
    const token = request.accessToken;

    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      // Validate token (checks signature, expiry, revocation)
      const tokenData = await this.tokenService.validateVaultToken(token);

      // Attach token context to request for downstream handlers
      request.tokenContext = tokenData;

      return true;
    } catch (error) {
      throw new UnauthorizedException(
        `Token validation failed: ${(error as Error).message}`,
      );
    }
  }
}
