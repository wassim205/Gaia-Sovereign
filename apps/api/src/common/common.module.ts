import { Module, Global } from '@nestjs/common';
import { EncryptionService } from './services/encryption.service';
import { RateLimiterService } from './services/rate-limiter.service';
import { KeyManagementService } from './services/key-management.service';
import { EncryptionServiceV2 } from './services/encryption-service-v2.service';

@Global()
@Module({
  providers: [
    EncryptionService,
    RateLimiterService,
    KeyManagementService,
    EncryptionServiceV2,
  ],
  exports: [
    EncryptionService,
    RateLimiterService,
    KeyManagementService,
    EncryptionServiceV2,
  ],
})
export class CommonModule {}
