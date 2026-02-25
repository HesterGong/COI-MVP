import { Db } from 'mongodb';

// ─── Event ────────────────────────────────────────────────────────────────────

/** Mirrors admin portal sendCOI(policyFoxdenId, country, additionalInsured) */
export interface COIRequested {
  policyFoxdenId: string;
  /** admin portal calls this 'country' */
  geography: 'US' | 'CA';
  additionalInsured: AdditionalInsured;
}

// ─── Shared Address ───────────────────────────────────────────────────────────

export interface Address {
  street: string;
  city: string;
  /** abbreviated: ON, BC, TX, CA, etc. */
  province: string;
  postalCode: string;
}

export interface AdditionalInsured {
  name: string;
  address: Address;
}

// ─── Coverage Types (Canada) ──────────────────────────────────────────────────

export interface CoiCoverageAmount {
  amount: number;
  deductible: number;
}

export interface CoiGlCoverage {
  generalAggregate: CoiCoverageAmount;
  eachOccurrence: CoiCoverageAmount;
  productAndCompletedOperationsAggregate: CoiCoverageAmount;
  personalAndAdvertisingInjuryLiability: CoiCoverageAmount;
  medicalPayments: CoiCoverageAmount;
  tenantLegalLiability: CoiCoverageAmount;
  pollutionLiabilityExtension?: CoiCoverageAmount;
}

export interface CoiEoCoverage {
  deductible: number;
  aggregateAmount: number;
  occurrenceAmount: number;
}

export interface CoiCoverageInput {
  name: string;
  limit: { amount: number; deductible: number };
}

export interface CoiCoverages {
  gl: CoiGlCoverage;
  eo?: CoiEoCoverage;
  others: CoiCoverageInput[];
}

// ─── Rating Input Types ───────────────────────────────────────────────────────

export interface CanadaRatingGlInput {
  aggregateLimit: unknown;
  deductible: unknown;
  limitedCoverageForUnmannedAircraft: boolean;
  limitedCoverageForUnmannedAircraftLimit: unknown;
  limitedPollutionLiability: boolean;
  limitedPollutionLiabilityOccurrenceLimit: unknown;
  medicalPaymentsLimit: unknown;
  occurrenceLimit: unknown;
  tenantLegalLiabilityLimit: unknown;
  miscellaneousEODeductible: unknown;
  miscellaneousEOOccurrenceLimit: unknown;
  miscellaneousEOAggregateLimit: unknown;
  miscellaneousEO: boolean;
}

export interface CanadaRatingInput {
  GL: CanadaRatingGlInput;
  [key: string]: unknown;
}

export interface UsCommonRatingGlInput {
  policyEffectiveDate: Date;
  policyExpirationDate: Date;
  occurrenceLimit: number;
  premisesRentedToYouLimit: number;
  medicalPaymentsLimit: number;
  aggregateLimit: number;
  [key: string]: unknown;
}

export interface UsCommonRatingInput {
  GL: UsCommonRatingGlInput;
  [key: string]: unknown;
}

// ─── Raw Policy Data ──────────────────────────────────────────────────────────

/** Output of the extract phase — everything needed to run the pipeline */
export interface RawPolicyData {
  policyFoxdenId: string;
  geography: 'US' | 'CA';
  additionalInsured: AdditionalInsured;

  /** Discovered from policyData.policies */
  lobs: string[];
  carrierPartner: string;
  timeZone: string;
  recipientEmail: string;
  applicationId: string;

  // Common business info
  businessName: string;
  dbaName: string | undefined;

  // Canada-specific
  namedInsuredAddress?: Address;
  rawProfession?: string | string[];
  effectiveDate?: Date;
  expiryDate?: Date;
  caRatingInput?: CanadaRatingInput;

  // US-specific
  businessAddress?: Address;
  professionList?: string[];
  usRatingInput?: UsCommonRatingInput;

  // Policy LOB array (for getPolicyIdByLineOfBusiness)
  policyLobs?: Array<{ kind: string; policyId: string; munichPolicyId?: string }>;
}

// ─── Canonical Model ──────────────────────────────────────────────────────────

/** Unified model produced by the transform phase, consumed by map/load phases */
export interface Canonical {
  policyFoxdenId: string;
  /** US: GL policyId from getPolicyIdByLineOfBusiness; CA: same as policyFoxdenId */
  policyNumber: string;

  insurer: {
    name: string;
  };

  /** Named insured (CA uses .name and .address; US uses .block) */
  insured: {
    /** US: multi-line formatted string for ACORD 25 form */
    block: string;
    /** CA: named insured name */
    name: string;
    /** CA: named insured address */
    address: Address;
  };

  additionalInsured: AdditionalInsured;

  certificateNumber: number;

  dates: {
    effectiveDate: Date;
    expirationDate: Date;
  };

  limits: {
    occurrenceLimit: number;
    premisesRentedToYouLimit: number;
    medicalPaymentsLimit: number;
    aggregateLimit: number;
  };

  /** Profession list joined as a single string */
  description: string;

  /** US: certificate holder = additionalInsured */
  certificateHolder: AdditionalInsured;

  /** CA: GL + optional EO + other coverages */
  coverages: CoiCoverages;

  producer: {
    name: string;
    phone: string;
    email: string;
  };
}

// ─── Config ───────────────────────────────────────────────────────────────────

export interface COIConfig {
  lob: string;
  geography: 'US' | 'CA';
  carrierPartner: string;
  dbCollection: string;
  templateType: 'acord25' | 'html-handlebars';
  templatePath: string;
  formsConfigPath?: string;
  signaturePath?: string;
  emailTemplatePath: string;
  fieldMappings: Record<string, string>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

export interface Logger {
  debug(msg: string, meta?: unknown): void;
  info(msg: string, meta?: unknown): void;
  warn(msg: string, meta?: unknown): void;
  error(msg: string, meta?: unknown): void;
}

export interface COIContext {
  db: Db;
  logger: Logger;
  now: Date;
}
