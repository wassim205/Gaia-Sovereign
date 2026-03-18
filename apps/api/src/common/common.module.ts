import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { RateLimiterService } from './services/rate-limiter.service';

@Global()
@Module({
  providers: [EncryptionService, RateLimiterService],
  exports: [EncryptionService, RateLimiterService],
})
export class CommonModule {}
