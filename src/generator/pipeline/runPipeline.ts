import { COIConfig, COIContext, RawPolicyData } from '../../types';
import { buildCanonical } from '../transform/transform';
import { mapData } from '../map/mapData';
import { loadPdf } from '../load/loadPdf';

/**
 * Port from coi-mvp-etl/src/generator/pipeline/runPipeline.mjs (extended with context + real data)
 *
 * Orchestrates the ETL pipeline for a single LOB:
 *   TRANSFORM → MAP → LOAD (render PDF + send email)
 *
 * Extract already happened in the handler and raw data is passed in.
 */
export async function runPipeline({
  config,
  raw,
  lob,
  context,
}: {
  config: COIConfig;
  raw: RawPolicyData;
  lob: string;
  context: COIContext;
}): Promise<{ pdfBytes: Uint8Array | Buffer }> {
  const { db, logger, now } = context;

  logger.debug('runPipeline: starting', { lob, geography: raw.geography, carrierPartner: raw.carrierPartner });

  // ─── TRANSFORM ───────────────────────────────────────────────────────────────
  const canonical = await buildCanonical({ raw, lob, db });

  logger.debug('runPipeline: canonical built', { lob });

  // ─── MAP ─────────────────────────────────────────────────────────────────────
  const mapped = mapData(
    {
      canonical,
      lob,
      geography: raw.geography,
      carrierPartner: raw.carrierPartner,
      timeZone: raw.timeZone,
      now,  // used by CA template for dateNow (Date Issued field)
    },
    config.fieldMappings,
  );

  logger.debug('runPipeline: fields mapped', { lob, fields: Object.keys(mapped) });

  // ─── LOAD (render PDF + send email) ─────────────────────────────────────────
  const pdfBytes = await loadPdf(config, mapped, {
    recipientEmail: raw.recipientEmail,
    geography: raw.geography,
    policyFoxdenId: raw.policyFoxdenId,
    lob,
    browserlessToken: process.env.BROWSERLESS_API_TOKEN,
    logger,
  });

  logger.info('runPipeline: completed successfully', { lob, geography: raw.geography });

  return { pdfBytes };
}
