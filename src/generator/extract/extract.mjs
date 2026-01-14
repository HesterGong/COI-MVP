import { getPolicyFromCollection, getCoveragesForLob } from '../../fixtures.mjs';

/**
 * MVP EXTRACT step.
 * Production: read MongoDB collection specified by config.dbCollection.
 */
export async function extract(dbCollection, { applicationId, policyFoxdenId, lob, geography }) {
  const policy = getPolicyFromCollection(dbCollection, policyFoxdenId);
  const coverages = getCoveragesForLob(lob);

  return {
    applicationId,
    dbCollection,
    geography,
    lob,
    policy,
    coverages
  };
}
