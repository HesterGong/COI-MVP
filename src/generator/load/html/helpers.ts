import { format } from 'date-fns-tz';

/**
 * Port from coi-mvp-etl and foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts
 *
 * Handlebars helpers for the Canada COI HTML template.
 */

/** CAD currency formatter — $X,XXX with no decimals */
export function formatCurrencyCAD(val: unknown): string {
  if (val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : Number(val);
  if (Number.isNaN(num)) return '';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/** Timezone-aware date formatter — yyyy/MM/dd */
export function formatDateCA(date: unknown, timeZone: string): string {
  if (!(date instanceof Date)) return '';
  try {
    return format(date, 'yyyy/MM/dd', { timeZone });
  } catch {
    return format(date, 'yyyy/MM/dd');
  }
}

/** Canadian province abbreviation → full name */
const PROVINCE_MAP: Record<string, string> = {
  AB: 'Alberta',
  BC: 'British Columbia',
  MB: 'Manitoba',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  NT: 'Northwest Territories',
  NS: 'Nova Scotia',
  NU: 'Nunavut',
  ON: 'Ontario',
  PE: 'Prince Edward Island',
  QC: 'Quebec',
  SK: 'Saskatchewan',
  YT: 'Yukon',
};

export function toLongProvinceName(val: unknown): string {
  if (typeof val !== 'string') {
    throw new Error('Unreachable - expecting an abbreviation for the province');
  }
  return PROVINCE_MAP[val] ?? val;
}
