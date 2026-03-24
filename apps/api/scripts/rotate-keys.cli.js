#!/usr/bin/env node

/**
 * GS-135: Key Rotation CLI
 *
 * Usage:
 *   node rotate-keys.cli.js --user-id=<userId> --master-key=<key> [--batch-size=100] [--dry-run]
 *   node rotate-keys.cli.js --rotate-all [--batch-size=100]
 *   node rotate-keys.cli.js --status
 *
 * Examples:
 *   npm run rotate-keys -- --user-id=abc123 --master-key=mysecret
 *   npm run rotate-keys -- --status
 *   npm run rotate-keys -- --user-id=abc123 --master-key=mysecret --dry-run
 */

const path = require('path');
const NestFactory = require('@nestjs/core').NestFactory;
const AppModule = require('../app.module').AppModule;

async function runKeyRotation() {
  // Parse CLI args
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  // Bootstrap NestJS
  const app = await NestFactory.create(AppModule);
  const keyRotationService = app.get('KeyRotationService');

  try {
    if (options.status) {
      console.log('📊 Checking rotation status...');
      const status = await keyRotationService.getRotationStatus();
      console.log(JSON.stringify(status, null, 2));
    } else if (options.userId && options.masterKey) {
      const batchSize = options.batchSize || 100;
      const dryRun = options.dryRun || false;

      if (dryRun) {
        console.log('🔍 DRY RUN MODE - No data will be modified');
      }

      console.log(`🔄 Rotating keys for user ${options.userId}...`);
      const result = await keyRotationService.rotateFieldsBatch(
        options.userId,
        options.masterKey,
        batchSize,
        dryRun,
      );

      console.log('✅ Rotation complete:');
      console.log(`  Processed: ${result.processed}`);
      console.log(`  Skipped: ${result.skipped}`);
      console.log(`  Errors: ${result.errors}`);

      // Validate
      if (!dryRun && result.errors === 0) {
        console.log('\n🔐 Validating rotation integrity...');
        const validation = await keyRotationService.validateRotationIntegrity(
          options.userId,
          options.masterKey,
          10,
        );
        console.log(`  Validated: ${validation.validated}/${validation.validated + validation.failed}`);
        if (validation.failed > 0) {
          console.log('⚠️  Validation issues found:');
          validation.errors.forEach((err) => console.log(`    - ${err}`));
        }
      }
    } else {
      console.error('❌ Missing required options');
      console.error('Usage:');
      console.error('  --user-id=<id> --master-key=<key>  Rotate keys for specific user');
      console.error('  --status                             Check rotation status');
      console.error('  --dry-run                            Simulate without committing');
      process.exit(1);
    }

    await app.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Rotation failed:', err);
    await app.close();
    process.exit(1);
  }
}

function parseArgs(args) {
  const options: any = {};
  for (const arg of args) {
    if (arg.startsWith('--')) {
      const [key, value] = arg.substring(2).split('=');
      if (value) {
        options[key] = value;
      } else {
        options[key] = true;
      }
    }
  }
  return options;
}

runKeyRotation().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
