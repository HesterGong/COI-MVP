import { Address } from '../../../types';

/**
 * Port from foxden-policy-document-backend/src/utils/address/isAddressType.ts
 *
 * Runtime type guard for Address objects.
 * Accepts both Canadian province abbreviations (ON, BC, ...) and US state abbreviations.
 */
export function isAddressType(val: unknown): val is Address {
  if (!val || typeof val !== 'object') {
    throw new Error('Address is not defined');
  }

  const { city, postalCode, province, street } = val as Partial<Address>;

  const isCityValid = typeof city === 'string' && city.trim().length > 0;
  const isPostalCodeValid = typeof postalCode === 'string' && postalCode.trim().length > 0;
  const isStreetValid = typeof street === 'string' && street.trim().length > 0;
  // Accept any non-empty string for province (covers both CA provinces and US states)
  const isProvinceValid = typeof province === 'string' && province.trim().length > 0;

  return isCityValid && isPostalCodeValid && isStreetValid && isProvinceValid;
}
