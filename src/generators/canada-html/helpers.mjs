import { format } from 'date-fns-tz';

export function formatCurrencyCAD(val) {
  if (val == null) return '';
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Number(val));
}

export function formatDateCA(date, timeZone) {
  if (!(date instanceof Date)) return '';
  return format(date, 'yyyy/MM/dd', { timeZone });
}

const PROVINCE_MAP = {
  ON: 'Ontario',
  QC: 'Quebec',
  BC: 'British Columbia',
  AB: 'Alberta',
  MB: 'Manitoba',
  SK: 'Saskatchewan',
  NS: 'Nova Scotia',
  NB: 'New Brunswick',
  NL: 'Newfoundland and Labrador',
  PE: 'Prince Edward Island'
};

export function toLongProvinceName(code) {
  return PROVINCE_MAP[code] || code;
}
