import { Db } from 'mongodb';
import {
  Canonical,
  CoiCoverages,
  RawPolicyData,
  UsCommonRatingInput,
  Address,
} from '../../types';
import { generateNamedInsured } from './utils/generateNamedInsured';
import { isAddressType } from './utils/isAddressType';
import { getPolicyIdByLineOfBusiness } from './utils/getPolicyIdByLineOfBusiness';

/**
 * Port from foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts
 *
 * Validates US rating data, extracts GL limits, formats insured block,
 * resolves policyNumber via getPolicyIdByLineOfBusiness.
 *
 * Certificate number: read-only count from COIRecord collection + 1.
 */
export async function transformUS(
  raw: RawPolicyData,
  lob: string,
  db: Db,
): Promise<
  Pick<
    Canonical,
    | 'insured'
    | 'policyNumber'
    | 'certificateNumber'
    | 'dates'
    | 'limits'
    | 'description'
    | 'coverages'
  >
> {
  const {
    policyFoxdenId,
    businessName,
    dbaName,
    businessAddress,
    professionList,
    usRatingInput,
    policyLobs,
  } = raw;

  if (!usRatingInput) {
    throw new Error('Unreachable - US rating input missing for US path');
  }

  if (!businessAddress) {
    throw new Error('Unreachable - businessAddress missing for US path');
  }

  if (!isAddressType(businessAddress)) {
    throw new Error(
      "Unreachable - BusinessInformation_100_BusinessAddress_WORLD_EN isn't an address",
    );
  }

  if (!Array.isArray(professionList)) {
    throw new Error('Unreachable - professionLabelList must be an array');
  }

  // ─── Extract rating ──────────────────────────────────────────────────────────
  const {
    GL: {
      policyEffectiveDate,
      policyExpirationDate,
      occurrenceLimit,
      premisesRentedToYouLimit,
      medicalPaymentsLimit,
      aggregateLimit,
    },
  } = usRatingInput as UsCommonRatingInput;

  // ─── Policy number ───────────────────────────────────────────────────────────
  const policyNumber = getPolicyIdByLineOfBusiness(policyLobs ?? [], lob);

  // ─── Certificate number (read-only count from COIRecord, or 1 if none) ───────
  let certificateNumber = 1;
  try {
    const count = await db
      .collection('COIRecord')
      .countDocuments({ 'data.policyFoxdenId': policyNumber });
    certificateNumber = count + 1;
  } catch {
    // Collection may not exist or be inaccessible; default to 1
    certificateNumber = 1;
  }

  // ─── Named insured block ─────────────────────────────────────────────────────
  const namedInsuredName = generateNamedInsured(businessName, dbaName);
  const addr = businessAddress as Address;
  const insuredBlock = `${namedInsuredName}\n${addr.street}\n${addr.city}, ${addr.province}, ${addr.postalCode}`;

  // US COI doesn't carry separate CA coverages structure — use empty placeholder
  const coverages: CoiCoverages = {
    gl: {
      generalAggregate: { amount: aggregateLimit, deductible: 0 },
      eachOccurrence: { amount: occurrenceLimit, deductible: 0 },
      productAndCompletedOperationsAggregate: { amount: aggregateLimit, deductible: 0 },
      personalAndAdvertisingInjuryLiability: { amount: occurrenceLimit, deductible: 0 },
      medicalPayments: { amount: medicalPaymentsLimit, deductible: 0 },
      tenantLegalLiability: { amount: premisesRentedToYouLimit, deductible: 0 },
    },
    others: [],
  };

  return {
    policyNumber,
    certificateNumber,
    insured: {
      block: insuredBlock,
      name: namedInsuredName,
      address: addr,
    },
    dates: {
      effectiveDate: policyEffectiveDate instanceof Date
        ? policyEffectiveDate
        : new Date(policyEffectiveDate as unknown as string),
      expirationDate: policyExpirationDate instanceof Date
        ? policyExpirationDate
        : new Date(policyExpirationDate as unknown as string),
    },
    limits: {
      occurrenceLimit,
      premisesRentedToYouLimit,
      medicalPaymentsLimit,
      aggregateLimit,
    },
    description: professionList.join(', '),
    coverages,
  };
}
