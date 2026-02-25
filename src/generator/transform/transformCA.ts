import {
  Canonical,
  CanadaRatingInput,
  CoiCoverageAmount,
  CoiCoverages,
  RawPolicyData,
  Address,
} from '../../types';
import { generateNamedInsured } from './utils/generateNamedInsured';
import { isAddressType } from './utils/isAddressType';

/**
 * Port from foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts
 *
 * Validates Canada rating data, extracts GL/EO/other limits, builds Canada canonical.
 */
export function transformCA(
  raw: RawPolicyData,
  lob: string,
): Pick<
  Canonical,
  | 'insurer'
  | 'insured'
  | 'dates'
  | 'limits'
  | 'coverages'
  | 'description'
  | 'policyNumber'
> {
  const {
    policyFoxdenId,
    businessName,
    dbaName,
    namedInsuredAddress,
    rawProfession,
    effectiveDate,
    expiryDate,
    caRatingInput,
  } = raw;

  if (!caRatingInput) {
    throw new Error('Unreachable - Canada rating input missing for CA path');
  }

  if (!namedInsuredAddress) {
    throw new Error('Unreachable - namedInsuredAddress missing for CA path');
  }

  if (!isAddressType(namedInsuredAddress)) {
    throw new Error(
      'Unreachable - Named Insured address (stored in database) should be an underwriting address',
    );
  }

  if (!effectiveDate || !expiryDate) {
    throw new Error('Unreachable - effectiveDate / expiryDate missing for CA path');
  }

  if (effectiveDate instanceof Date === false) {
    throw new Error('Unreachable - inconsistent database: effectiveDate is not a Date');
  }

  const professionList: string[] = Array.isArray(rawProfession)
    ? (rawProfession as string[])
    : typeof rawProfession === 'string'
    ? [rawProfession]
    : [];

  // ─── Extract rating ──────────────────────────────────────────────────────────
  const {
    GL: {
      aggregateLimit: aggregateLimitUnknown,
      deductible: deductibleUnknown,
      limitedCoverageForUnmannedAircraft,
      limitedCoverageForUnmannedAircraftLimit: limitedCoverageForUnmannedAircraftLimitUnknown,
      limitedPollutionLiability,
      limitedPollutionLiabilityOccurrenceLimit: limitedPollutionLiabilityOccurrenceLimitUnknown,
      medicalPaymentsLimit: medicalPaymentsLimitUnknown,
      occurrenceLimit: occurrenceLimitUnknown,
      tenantLegalLiabilityLimit: tenantLegalLiabilityLimitUnknown,
      miscellaneousEODeductible: miscellaneousEODeductibleUnknown,
      miscellaneousEOOccurrenceLimit: miscellaneousEOOccurrenceLimitUnknown,
      miscellaneousEOAggregateLimit: miscellaneousEOAggregateLimitUnknown,
      miscellaneousEO,
    },
  } = caRatingInput as CanadaRatingInput;

  if (typeof limitedPollutionLiability !== 'boolean') {
    throw new Error("Unreachable - limitedPollutionLiability isn't a boolean");
  }

  if (typeof limitedCoverageForUnmannedAircraft !== 'boolean') {
    throw new Error("Unreachable - limitedCoverageForUnmannedAircraft isn't a boolean");
  }

  if (typeof miscellaneousEO !== 'boolean') {
    throw new Error("Unreachable - miscellaneousEO isn't a boolean");
  }

  const aggregateLimit = Number(aggregateLimitUnknown);
  const deductible = Number(deductibleUnknown);
  const limitedPollutionLiabilityOccurrenceLimit = Number(
    limitedPollutionLiabilityOccurrenceLimitUnknown,
  );
  const medicalPaymentsLimit = Number(medicalPaymentsLimitUnknown);
  const occurrenceLimit = Number(occurrenceLimitUnknown);
  const tenantLegalLiabilityLimit = Number(tenantLegalLiabilityLimitUnknown);
  const miscellaneousEODeductible = Number(miscellaneousEODeductibleUnknown);
  const miscellaneousEOAggregateLimit = Number(miscellaneousEOAggregateLimitUnknown);
  const miscellaneousEOOccurrenceLimit = Number(miscellaneousEOOccurrenceLimitUnknown);

  // ─── Build coverages ─────────────────────────────────────────────────────────

  const glCoverage: CoiCoverages['gl'] = {
    generalAggregate: { amount: aggregateLimit, deductible },
    eachOccurrence: { amount: occurrenceLimit, deductible },
    productAndCompletedOperationsAggregate: { amount: occurrenceLimit, deductible },
    personalAndAdvertisingInjuryLiability: { amount: occurrenceLimit, deductible },
    medicalPayments: { amount: medicalPaymentsLimit, deductible },
    tenantLegalLiability: { amount: tenantLegalLiabilityLimit, deductible },
    ...(limitedPollutionLiability
      ? {
          pollutionLiabilityExtension: {
            amount: limitedPollutionLiabilityOccurrenceLimit,
            deductible,
          } as CoiCoverageAmount,
        }
      : {}),
  };

  const eo = miscellaneousEO
    ? {
        deductible: miscellaneousEODeductible,
        aggregateAmount: miscellaneousEOAggregateLimit,
        occurrenceAmount: miscellaneousEOOccurrenceLimit,
      }
    : undefined;

  const others: CoiCoverages['others'] = [];

  if (limitedCoverageForUnmannedAircraft) {
    const limitedCoverageForUnmannedAircraftLimit = Number(
      limitedCoverageForUnmannedAircraftLimitUnknown,
    );
    others.push({
      name: 'Unmanned aircraft',
      limit: {
        amount: limitedCoverageForUnmannedAircraftLimit,
        deductible,
      },
    });
  }

  const coverages: CoiCoverages = {
    gl: glCoverage,
    eo,
    others,
  };

  // ─── Named insured ───────────────────────────────────────────────────────────
  const namedInsuredName = generateNamedInsured(businessName, dbaName);

  return {
    policyNumber: policyFoxdenId, // CA uses policyFoxdenId as the displayed policy number
    insurer: {
      name: "Certain Underwriters at Lloyd's of London",
    },
    insured: {
      block: `${namedInsuredName}\n${namedInsuredAddress.street}\n${namedInsuredAddress.city}, ${namedInsuredAddress.province}, ${namedInsuredAddress.postalCode}`,
      name: namedInsuredName,
      address: namedInsuredAddress as Address,
    },
    dates: {
      effectiveDate,
      expirationDate: expiryDate,
    },
    limits: {
      occurrenceLimit,
      premisesRentedToYouLimit: 0, // Not applicable for CA
      medicalPaymentsLimit,
      aggregateLimit,
    },
    coverages,
    description: professionList.join(', '),
  };
}
