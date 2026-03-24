import { Injectable, Logger } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/**
 * GS-123: Audit logs retention policy service
 * Manages deletion/archival of old audit logs based on retention period
 */
@Injectable()
export class AuditRetentionService {
  private readonly logger = new Logger(AuditRetentionService.name);
  private readonly DEFAULT_RETENTION_DAYS = 90;

  constructor(private auditLogService: AuditLogService) {}

  /**
   * Get retention days from env or use default
   */
  getRetentionDays(): number {
    const envDays = process.env.AUDIT_LOG_RETENTION_DAYS;
    if (envDays) {
      const parsed = parseInt(envDays, 10);
      if (!isNaN(parsed) && parsed > 0) {
        return parsed;
      }
    }
    return this.DEFAULT_RETENTION_DAYS;
  }

  /**
   * Calculate the cutoff date for retention
   */
  getRetentionCutoffDate(): Date {
    const retentionDays = this.getRetentionDays();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    return cutoffDate;
  }

  /**
   * Apply retention policy: archive old logs
   * Archiving preserves logs for compliance but marks them as archived
   */
  async applyRetentionPolicy(
    shouldArchive: boolean = true,
  ): Promise<{ count: number; action: string }> {
    const cutoffDate = this.getRetentionCutoffDate();
    const retentionDays = this.getRetentionDays();

    this.logger.log(
      `Applying audit log retention policy (${retentionDays} days, cutoff: ${cutoffDate.toISOString()})`,
    );

    try {
      if (shouldArchive) {
        const result = await this.auditLogService.archiveOlderThan(cutoffDate);
        this.logger.log(`Archived ${result.count} audit log entries`);
        return {
          count: result.count,
          action: 'archived',
        };
      } else {
        const result = await this.auditLogService.deleteOlderThan(cutoffDate);
        this.logger.log(`Deleted ${result.count} audit log entries`);
        return {
          count: result.count,
          action: 'deleted',
        };
      }
    } catch (error) {
      this.logger.error(
        `Error applying retention policy: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    }
  }

  /**
   * Schedule retention job to run periodically
   * Can be called from a cron job or scheduled task
   * Usage: Run daily or weekly based on business requirements
   */
  async runRetentionJob(): Promise<void> {
    const shouldArchive =
      (process.env.AUDIT_LOG_ARCHIVE_MODE || 'true').toLowerCase() === 'true';

    await this.applyRetentionPolicy(shouldArchive);
  }
}
