import { MongoDBConnection } from '@foxden/shared-lib';
import { COIRequested } from './types';
import { buildContext } from './context';
import { extract } from './generator/extract/extract';
import { generateCOI } from './generator/generateCOI';
import { hasConfig } from './generator/config/coiConfig';

/**
 * Lambda-style handler — mirrors admin portal's sendCOI(policyFoxdenId, country, additionalInsured).
 *
 * 1. Connects to MongoDB via MongoDBConnection (shared-lib) — same as foxden-policy-document-backend.
 *    STAGE env var controls SSM parameter namespace (e.g. 'local', 'dev', 'prod').
 *    MONGODB_URI env var provides the connection string.
 * 2. Extracts policy data once (discovers all LOBs)
 * 3. Iterates LOBs, calls generateCOI per LOB
 * 4. Per-LOB errors are caught and logged; other LOBs continue
 */
export async function handler(evt: COIRequested): Promise<void> {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const stage = process.env.STAGE ?? 'local';
  const mongoDbConnection = new MongoDBConnection(stage);
  const client = await mongoDbConnection.connect(mongoUri);

  try {
    const db = client.db();
    const context = buildContext(db);
    const { logger } = context;

    logger.info('handler: received COIRequested event', {
      policyFoxdenId: evt.policyFoxdenId,
      geography: evt.geography,
      additionalInsuredName: evt.additionalInsured.name,
    });

    // ─── EXTRACT (once for all LOBs) ────────────────────────────────────────────
    const raw = await extract({
      policyFoxdenId: evt.policyFoxdenId,
      geography: evt.geography,
      additionalInsured: evt.additionalInsured,
      db,
      logger,
    });

    logger.info('handler: policy extracted', {
      lobs: raw.lobs,
      carrierPartner: raw.carrierPartner,
      geography: raw.geography,
    });

    // ─── Filter to LOBs with a config entry ─────────────────────────────────────
    const eligibleLobs = raw.lobs.filter((lob) =>
      hasConfig({ lob, geography: raw.geography, carrierPartner: raw.carrierPartner }),
    );

    if (eligibleLobs.length === 0) {
      logger.warn('handler: no eligible LOBs found — check coiConfig.ts for missing entries', {
        lobs: raw.lobs,
        geography: raw.geography,
        carrierPartner: raw.carrierPartner,
      });
      return;
    }

    // ─── Generate COI per LOB (continue on per-LOB errors) ──────────────────────
    const results = await Promise.allSettled(
      eligibleLobs.map((lob) => generateCOI({ raw, lob, context })),
    );

    let successCount = 0;
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const lob = eligibleLobs[i];

      if (result.status === 'fulfilled') {
        successCount++;
        logger.info('handler: LOB completed successfully', { lob });
      } else {
        logger.error('handler: LOB failed', {
          lob,
          error: result.reason instanceof Error ? result.reason.message : String(result.reason),
        });
      }
    }

    logger.info('handler: finished', {
      total: eligibleLobs.length,
      success: successCount,
      failed: eligibleLobs.length - successCount,
    });
  } finally {
    await mongoDbConnection.disconnect();
  }
}

// ─── CLI entry point (for local testing) ──────────────────────────────────────
if (require.main === module) {
  const testEvent: COIRequested = {
    policyFoxdenId: process.env.TEST_POLICY_ID ?? 'test-policy-id',
    geography: (process.env.TEST_GEOGRAPHY as 'US' | 'CA') ?? 'US',
    additionalInsured: {
      name: process.env.TEST_AI_NAME ?? 'Test Certificate Holder Inc.',
      address: {
        street: process.env.TEST_AI_STREET ?? '123 Main St',
        city: process.env.TEST_AI_CITY ?? 'Toronto',
        province: process.env.TEST_AI_PROVINCE ?? 'ON',
        postalCode: process.env.TEST_AI_POSTAL ?? 'M5H 1J8',
      },
    },
  };

  handler(testEvent)
    .then(() => {
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
