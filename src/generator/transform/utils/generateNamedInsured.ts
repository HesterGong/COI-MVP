/**
 * Port from foxden-policy-document-backend/src/utils/generateNamedInsured.ts
 *
 * Combines company name and optional DBA name into a display string.
 * e.g. "Acme Corp" or "Acme Corp DBA The Widget Store"
 */
export function generateNamedInsured(
  companyName: unknown,
  dbaName: unknown,
): string {
  if (typeof companyName !== 'string') {
    throw new Error('Invalid company name');
  }
  let dba: string | undefined;
  if (typeof dbaName === 'string' && dbaName.trim().length > 0) {
    dba = dbaName;
  }
  return dba ? `${companyName} DBA ${dba}` : companyName;
}
