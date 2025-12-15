import { extract } from '../extract/extract.mjs';
import { applyTransforms, buildCanonical } from '../transform/transform.mjs';
import { mapData } from '../map/mapData.mjs';
import { loadPdf } from '../load/loadPdf.mjs';

/**
 * Generic ETL pipeline (no LOB branching).
 *
 * EXTRACT    -> fixtures (today) / MongoDB (prod)
 * TRANSFORM  -> canonical normalization (+ optional transforms)
 * MAP        -> canonical -> variables required by template/form config
 * LOAD       -> renderer selection (ACORD25 vs HTML)
 */
export async function runPipeline({
  config,
  workflowId,
  policyFoxdenId,
  lob,
  geography,
  carrierPartner,
  timeZone,
  additionalInsured
}) {
  const raw = await extract(config.dbCollection, { workflowId, policyFoxdenId, lob, geography });
  // transform
  const transformed = await applyTransforms(raw, config.transforms ?? []);
  const canonical = await buildCanonical({ transformed, lob, geography, additionalInsured });
  // map
  const mapped = mapData(
    { canonical, lob, geography, carrierPartner, timeZone },
    config.fieldMappings
  );
  // load
  return loadPdf(config, mapped);
}
