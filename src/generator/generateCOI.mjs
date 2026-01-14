import { loadConfig } from './config/loadConfig.mjs';
import { runPipeline } from './pipeline/runPipeline.mjs';

/**
 * Entry point (per LOB).
 * Mirrors design doc:
 *   generateCOI({ applicationId, lob, geography, carrierPartner })
 *
 * MVP notes:
 * - no DB (extract reads fixtures)
 * - no S3/email (controller writes merged file to ./out)
 */
export async function generateCOI(input) {
  const config = await loadConfig({
    lob: input.lob,
    geography: input.geography,
    carrierPartner: input.carrierPartner
  });

  const pdfBytes = await runPipeline({
    config,
    applicationId: input.applicationId,
    policyFoxdenId: input.policyFoxdenId,
    lob: input.lob,
    geography: input.geography,
    carrierPartner: input.carrierPartner,
    timeZone: input.timeZone ?? 'America/New_York',
    additionalInsured: input.additionalInsured
  });

  return { pdfBytes };
}
