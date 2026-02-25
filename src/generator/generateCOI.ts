import { COIContext, RawPolicyData } from '../types';
import { loadConfig } from './config/loadConfig';
import { runPipeline } from './pipeline/runPipeline';

/**
 * Per-LOB entry point: loads config for (lob, geography, carrierPartner)
 * then runs the full ETL pipeline.
 *
 * Port from coi-mvp-etl/src/generator/generateCOI.mjs (extended with context + real data)
 */
export async function generateCOI({
  raw,
  lob,
  context,
}: {
  raw: RawPolicyData;
  lob: string;
  context: COIContext;
}): Promise<{ pdfBytes: Uint8Array | Buffer }> {
  const { logger } = context;

  logger.debug('generateCOI: loading config', {
    lob,
    geography: raw.geography,
    carrierPartner: raw.carrierPartner,
  });

  const config = await loadConfig({
    lob,
    geography: raw.geography,
    carrierPartner: raw.carrierPartner,
  });

  return runPipeline({ config, raw, lob, context });
}
