import { Db } from 'mongodb';
import {
  AdditionalInsured,
  CanadaRatingInput,
  RawPolicyData,
  UsCommonRatingInput,
  Logger,
} from '../../types';
import { findPolicyHead } from './findPolicyHead';

const DEFAULT_CARRIER_PARTNER = 'Foxquilt';

/**
 * Extract phase: retrieve all policy data from MongoDB for a single policyFoxdenId.
 *
 * - Calls findPolicyHead (MongoDB aggregation) to get the full policy view
 * - Discovers LOBs from policyData.policies array
 * - Returns RawPolicyData with everything needed for both CA and US paths
 */
export async function extract(
  {
    policyFoxdenId,
    geography,
    additionalInsured,
    db,
    logger,
  }: {
    policyFoxdenId: string;
    geography: 'US' | 'CA';
    additionalInsured: AdditionalInsured;
    db: Db;
    logger: Logger;
  },
): Promise<RawPolicyData> {
  logger.debug('extract: starting policy lookup', { policyFoxdenId, geography });

  const policyView = await findPolicyHead({ db, policyFoxdenId }, logger);

  if (!policyView) {
    throw new Error(`Policy not found: policyFoxdenId=${policyFoxdenId}`);
  }

  const {
    applicationAnswers,
    applicationOwner,
    quote,
    policy,
  } = policyView;

  const answers = applicationAnswers.data.answers;
  const timeZone = (applicationAnswers.data.timeZone as string) || 'America/Toronto';
  const recipientEmail = applicationOwner.data.authenticatedEmail;
  const applicationId = applicationAnswers.data.applicationId;

  const businessName = answers['BusinessInformation_100_CompanyName_WORLD_EN'] as string;
  const dbaName = answers['BusinessInformation_100_DBAName_WORLD_EN'] as string | undefined;

  const policyData = policy.data;
  const carrierPartner = (policyData.carrierPartner as string | undefined) || DEFAULT_CARRIER_PARTNER;

  // Discover LOBs from policyData.policies (US only — CA policies have policies: [])
  const policyLobs = (policyData.policies ?? []) as Array<{
    kind: string;
    policyId: string;
    munichPolicyId?: string;
  }>;

  // CA generates one combined COI per policyFoxdenId (GL + optional EO in one document).
  // policyData.policies is always [] for CA — LOBs are not stored there.
  // US policies store sub-policy IDs in policies[]: [{ kind: 'GL', policyId: '...' }, ...]
  const lobs: string[] =
    policyLobs.length > 0
      ? [...new Set(policyLobs.map((p) => p.kind))]
      : geography === 'CA'
      ? ['GL'] // CA: one COI document covers all coverages
      : [];   // US with empty policies — handler will warn

  logger.debug('extract: discovered LOBs', { lobs, carrierPartner });

  // Determine rating input type
  const quoteData = quote.data;
  const isCanada = quoteData.rating.kind === 'Canada';

  const raw: RawPolicyData = {
    policyFoxdenId,
    geography,
    additionalInsured,
    lobs,
    carrierPartner,
    timeZone,
    recipientEmail,
    applicationId,
    businessName,
    dbaName: typeof dbaName === 'string' && dbaName.trim().length > 0 ? dbaName : undefined,
    policyLobs,
  };

  if (geography === 'CA') {
    if (!isCanada) {
      logger.warn('extract: geography=CA but rating.kind is not Canada', { ratingKind: quoteData.rating.kind });
    }

    const namedInsuredAddress = answers['BusinessInformation_100_MailingAddress_WORLD_EN'];

    // Prefer professionLabelList (human-readable display names) over raw profession codes.
    // Original backend calls getProfessionNameList() to convert codes → names; we use the
    // pre-resolved label list instead since we don't have that lookup service.
    const professionLabelList = answers['professionLabelList'];
    const rawProfession = Array.isArray(professionLabelList) && professionLabelList.length > 0
      ? professionLabelList
      : answers['BusinessInformation_100_Profession_WORLD_EN'];

    raw.namedInsuredAddress = namedInsuredAddress as RawPolicyData['namedInsuredAddress'];
    raw.rawProfession = rawProfession as string | string[];
    raw.effectiveDate = policyData.coverage?.effectiveDate instanceof Date
      ? policyData.coverage.effectiveDate
      : new Date(policyData.coverage?.effectiveDate as string);
    raw.expiryDate = policyData.coverage?.expiryDate instanceof Date
      ? policyData.coverage.expiryDate
      : new Date(policyData.coverage?.expiryDate as string);

    if (quoteData.kind === 'Original') {
      raw.caRatingInput = (quoteData.rating as { kind: string; input: unknown }).input as CanadaRatingInput;
    }
  } else {
    // US
    if (isCanada) {
      logger.warn('extract: geography=US but rating.kind is Canada', { ratingKind: quoteData.rating.kind });
    }

    const businessAddress = answers['BusinessInformation_100_BusinessAddress_WORLD_EN'];
    const professionLabelList = answers['professionLabelList'];

    raw.businessAddress = businessAddress as RawPolicyData['businessAddress'];
    raw.professionList = Array.isArray(professionLabelList) ? professionLabelList as string[] : [];

    if (quoteData.kind === 'Original') {
      raw.usRatingInput = (quoteData.rating as { kind: string; input: unknown }).input as UsCommonRatingInput;
    }
  }

  return raw;
}
