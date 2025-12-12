import { getPolicyFromCollection, getCoveragesForLob } from '../../fixtures.mjs';

/**
 * MVP EXTRACT step.
 * Production: read MongoDB collection specified by config.dbCollection.
 */
export async function extract(dbCollection, { workflowId, policyFoxdenId, lob, geography }) {
  const policy = getPolicyFromCollection(dbCollection, policyFoxdenId);
  const coverages = getCoveragesForLob(lob);

  return {
    workflowId,
    dbCollection,
    geography,
    lob,
    policy,
    coverages
  };
}
