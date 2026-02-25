/**
 * Port from foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts
 *
 * Retrieves the policyId for a specific line of business from a list of policy LOB entries.
 */
export function getPolicyIdByLineOfBusiness(
  policies: Array<{ kind: string; policyId: string }>,
  lineOfBusiness: string,
): string {
  const match = policies.filter((p) => p.kind === lineOfBusiness)[0];
  if (!match) {
    throw new Error(`No policy found for line of business: ${lineOfBusiness}`);
  }
  return match.policyId;
}
