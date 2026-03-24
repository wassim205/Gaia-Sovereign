import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  KeyManagementService,
  EncryptionMetadata,
} from 'src/common/services/key-management.service';
import {
  EncryptionServiceV2,
  EncryptedPayload,
} from 'src/common/services/encryption-service-v2.service';

/**
 * GS-135: Key Rotation Service
 * Handles safe re-encryption of existing vault fields when keys are rotated.
 */

@Injectable()
export class KeyRotationService {
  private readonly logger = new Logger(KeyRotationService.name);

  constructor(
    private prisma: PrismaService,
    private keyManagementService: KeyManagementService,
    private encryptionServiceV2: EncryptionServiceV2,
  ) {}

  private parseMetadata(raw: string | null): EncryptionMetadata {
    try {
      const parsed: unknown = JSON.parse(raw || '{}');
      if (
        parsed &&
        typeof parsed === 'object' &&
        'keyVersion' in parsed &&
        typeof (parsed as { keyVersion: unknown }).keyVersion === 'number'
      ) {
        return parsed as EncryptionMetadata;
      }
    } catch {
      // Ignore invalid metadata and fallback to default.
    }

    return {
      keyVersion: 0,
      algorithm: 'UNKNOWN',
      nonce: '',
      tag: '',
      salt: '',
      encryptedAt: Date.now(),
    };
  }

  async initiateRotation() {
    const oldVersion = this.keyManagementService.getCurrentKeyVersion();
    const rotationMeta =
      this.keyManagementService.prepareKeyRotation(oldVersion);

    this.logger.log(
      `Key rotation initiated: ${oldVersion} -> ${rotationMeta.keyVersion}`,
    );

    const fieldsToRotate = await this.prisma.vaultField.count({
      where: {
        encryptionMeta: {
          not: null,
        },
      },
    });

    return {
      status: 'initiated',
      fromKeyVersion: oldVersion,
      toKeyVersion: rotationMeta.keyVersion,
      fieldsToRotate,
      startedAt: new Date(),
    };
  }

  async getRotationStatus() {
    const currentVersion = this.keyManagementService.getCurrentKeyVersion();
    const fieldsNeedingRotation = await this.prisma.vaultField.count({
      where: {
        encryptionMeta: {
          not: null,
        },
      },
    });

    return {
      currentKeyVersion: currentVersion,
      fieldsNeedingRotation,
      estimatedTimeMinutes: Math.ceil(fieldsNeedingRotation / 1000),
    };
  }

  async rotateFieldsBatch(
    userId: string,
    masterKey: string,
    batchSize: number = 100,
    dryRun: boolean = false,
  ) {
    const currentKeyVersion = this.keyManagementService.getCurrentKeyVersion();
    const stats = {
      processed: 0,
      skipped: 0,
      errors: 0,
      startedAt: new Date(),
      endedAt: new Date(),
    };

    try {
      const fieldsToRotate = await this.prisma.vaultField.findMany({
        where: {
          vaultEntry: {
            userId,
          },
          encryptionMeta: {
            not: null,
          },
        },
        take: batchSize,
        include: {
          vaultEntry: true,
        },
      });

      for (const field of fieldsToRotate) {
        try {
          const metadata = this.parseMetadata(field.encryptionMeta);

          if (metadata.keyVersion >= currentKeyVersion) {
            stats.skipped += 1;
            continue;
          }

          const payload: EncryptedPayload = {
            ciphertext: field.encryptedValue,
            metadata,
          };
          const plaintext = this.encryptionServiceV2.decryptWithMetadata(
            payload,
            userId,
            masterKey,
          );
          const newPayload = this.encryptionServiceV2.encryptWithMetadata(
            plaintext,
            userId,
            masterKey,
          );

          if (!dryRun) {
            await this.prisma.vaultField.update({
              where: { id: field.id },
              data: {
                encryptedValue: newPayload.ciphertext,
                encryptionMeta: JSON.stringify(newPayload.metadata),
              },
            });
          }

          stats.processed += 1;
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          this.logger.error(`Error rotating field ${field.id}: ${message}`);
          stats.errors += 1;
        }
      }

      stats.endedAt = new Date();
      this.logger.log(
        `Batch rotation complete: ${stats.processed} processed, ${stats.skipped} skipped, ${stats.errors} errors`,
      );

      return {
        ...stats,
        dryRun,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      this.logger.error(`Batch rotation failed: ${message}`);
      throw err;
    }
  }

  async rotateAllFieldsForUser(
    userId: string,
    masterKey: string,
    batchSize: number = 100,
  ) {
    const allStats = {
      totalProcessed: 0,
      totalSkipped: 0,
      totalErrors: 0,
      batches: 0,
      startedAt: new Date(),
    };

    let hasMoreFields = true;
    while (hasMoreFields) {
      const batchStats = await this.rotateFieldsBatch(
        userId,
        masterKey,
        batchSize,
        false,
      );

      allStats.totalProcessed += batchStats.processed;
      allStats.totalSkipped += batchStats.skipped;
      allStats.totalErrors += batchStats.errors;
      allStats.batches += 1;

      if (batchStats.processed + batchStats.skipped < batchSize) {
        hasMoreFields = false;
      }
    }

    allStats.startedAt = new Date();
    this.logger.log(
      `Full user rotation complete: ${allStats.totalProcessed} total processed`,
    );

    return allStats;
  }

  async validateRotationIntegrity(
    userId: string,
    masterKey: string,
    sampleSize: number = 10,
  ) {
    const fields = await this.prisma.vaultField.findMany({
      where: {
        vaultEntry: {
          userId,
        },
        encryptionMeta: {
          not: null,
        },
      },
      take: sampleSize,
    });

    const results = {
      validated: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const field of fields) {
      try {
        const metadata = this.parseMetadata(field.encryptionMeta);
        const payload: EncryptedPayload = {
          ciphertext: field.encryptedValue,
          metadata,
        };

        this.encryptionServiceV2.decryptWithMetadata(
          payload,
          userId,
          masterKey,
        );
        results.validated += 1;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        results.failed += 1;
        results.errors.push(`Field ${field.id}: ${message}`);
      }
    }

    return results;
  }
}
