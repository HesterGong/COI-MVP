import { Db } from 'mongodb';
import { Canonical, COIContext, RawPolicyData } from '../../types';
import { transformCA } from './transformCA';
import { transformUS } from './transformUS';

// Producer info (mirrors backend US_EMAIL / US_PHONE_NUMBER constants)
const CA_PRODUCER = {
  name: 'Foxquilt Insurance Services',
  phone: '1-877-469-3569',
  email: 'support@foxquilt.com',
};

const US_PRODUCER = {
  name: 'Foxquilt Insurance Services LLC',
  phone: '(888) 555-0100',
  email: 'support@foxquilt.com',
};

/**
 * Build a unified Canonical model from raw policy data.
 *
 * Routes to transformCA or transformUS based on geography.
 * Merges geography-specific fields with common fields (additionalInsured, producer, etc.).
 */
export async function buildCanonical(
  {
    raw,
    lob,
    db,
  }: {
    raw: RawPolicyData;
    lob: string;
    db: Db;
  },
): Promise<Canonical> {
  const { geography, additionalInsured, policyFoxdenId, carrierPartner, timeZone, recipientEmail } =
    raw;

  const producer = geography === 'CA' ? CA_PRODUCER : US_PRODUCER;

  if (geography === 'CA') {
    const caPartial = transformCA(raw, lob);

    return {
      ...caPartial,
      policyFoxdenId,
      additionalInsured,
      certificateNumber: 0, // Not used in CA path
      coverages: caPartial.coverages,
      // CA certificateHolder mirrors additionalInsured
      certificateHolder: additionalInsured,
      producer,
    } as Canonical;
  } else {
    const usPartial = await transformUS(raw, lob, db);

    return {
      ...usPartial,
      policyFoxdenId,
      additionalInsured,
      insurer: {
        name: 'State National Insurance Company', // Will be overridden by form config carrier value
      },
      certificateHolder: additionalInsured,
      producer,
      coverages: usPartial.coverages,
    } as Canonical;
  }
}
