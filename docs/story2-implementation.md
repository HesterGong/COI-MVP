# Story 2: Transform Layer Enhancement - Implementation Guide

**Story ID:** COI-2
**Priority:** High
**Story Points:** 10
**Phase:** 2 - Core Business Logic
**Epic:** COI-2024

## Description

Enhance the transform layer to handle real production data structures for both US and Canada. Port proven transformation logic from the old system, including string-to-number conversion for Canada, structured GL/EO coverage building, and US insured block formatting.

**IMPORTANT:** This story focuses on **PORTING existing transformation code**, not writing new code from scratch. The implementation must follow ETL design principles and be configuration-driven for business extensibility.

---

## ETL Design Principles for Transform Layer

### 1. Separation of Concerns
- **Extract Layer (Story 1):** Fetches raw data from MongoDB, no business logic
- **Transform Layer (THIS STORY):** Converts raw data to canonical model, applies business rules
- **Map Layer:** Maps canonical model to template-specific fields using configuration
- **Load Layer:** Generates PDF from mapped data

### 2. Configuration-Driven Approach
- Geography-specific transformations loaded from configuration
- LOB-specific rules defined in config files
- No hardcoded business logic - all rules externalized
- Easy to add new geographies (e.g., UK, AU) without code changes
- Easy to add new LOBs (e.g., E&O for more regions, BOP, Cyber) without code changes

### 3. Canonical Data Model
- Geography-agnostic structure
- LOB-agnostic where possible
- All geographies/LOBs map to same canonical schema
- Template rendering engines (US ACORD, Canada HTML) consume canonical model

---

## Current System Analysis

### Where This Logic Lives

**Canada GL Coverage Transformation:**
- **File:** [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
- **Lines:** 90-209
- **Purpose:** Converts Canada rating input (strings) into structured coverage objects for HTML PDF generation

**US Coverage Transformation:**
- **File:** [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
- **Lines:** 107-122
- **Purpose:** Creates flat UsCoiInput structure with insured block formatting

**Canada HTML Generation Helpers:**
- **File:** [foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts)
- **Lines:** 86-117
- **Purpose:** Handlebars helpers for formatting currency, dates, and province names

**Profession Name Lookup:**
- **File:** [foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts)
- **Lines:** 1-13
- **Purpose:** Converts profession codes to human-readable names using CSV mapping

---

## Key Functions to Port

### 1. Canada GL Coverage Builder (lines 90-203 in sendCertificateOfInsurance.ts)

**What it does:**
- Extracts GL coverage fields from `CanadaRatingInput`
- Converts string numbers to actual numbers (Canada sends as strings: `"5000000"` → `5000000`)
- Builds structured GL coverage object with 6 main coverages + optional pollution extension
- Each coverage has `{ amount, deductible }` structure

**Where to copy it:** `src/generator/transform/transformers/CanadaGLTransformer.ts`

**Changes needed:**
- Convert to TypeScript
- Use types from Story 1 (`CanadaRatingInput`)
- Load coverage field mappings from configuration
- Return structured coverage object

### 2. Canada EO Coverage Builder (lines 142-148 in sendCertificateOfInsurance.ts)

**What it does:**
- Checks `miscellaneousEO` boolean flag
- If true, builds EO coverage object: `{ deductible, aggregateAmount, occurrenceAmount }`
- If false, returns undefined

**Where to copy it:** `src/generator/transform/transformers/CanadaEOTransformer.ts`

**Changes needed:**
- Convert to TypeScript
- Make it conditional on boolean flag
- Support configuration for future EO variations

### 3. Canada Optional Coverages Builder (lines 150-164 in sendCertificateOfInsurance.ts)

**What it does:**
- Builds array of optional coverages (e.g., unmanned aircraft)
- Checks boolean flags to conditionally add coverages
- Each coverage has `{ name, limit: { amount, deductible } }` structure

**Where to copy it:** `src/generator/transform/transformers/CanadaOptionalCoveragesTransformer.ts`

**Changes needed:**
- Convert to TypeScript
- Load optional coverage definitions from configuration
- Support extensibility for future optional coverages

### 4. US Insured Block Formatter (line 108 in sendUsCertificateOfInsurance.ts)

**What it does:**
- Formats insured as multi-line string: `"Name\nStreet\nCity, State, Zip"`
- Used for ACORD 25 PDF form field

**Where to copy it:** `src/generator/transform/formatters/AddressFormatter.ts`

**Changes needed:**
- Convert to TypeScript
- Make format configurable (different geographies may need different formats)
- Use extracted data from Story 1

### 5. US Profession List Formatter (line 117 in sendUsCertificateOfInsurance.ts)

**What it does:**
- Joins profession list array with commas: `["Architect", "Engineer"]` → `"Architect, Engineer"`

**Where to copy it:** `src/generator/transform/formatters/ProfessionFormatter.ts`

**Changes needed:**
- Convert to TypeScript
- Handle empty arrays
- Make delimiter configurable

### 6. Profession Code to Name Converter (getProfessionNameList.ts)

**What it does:**
- Looks up profession codes in CSV file (`profession_mapper.csv`)
- Converts underwriting codes to human-readable names
- Example: `"ARCH_PROF"` → `"Architect"`

**Where to use it:** `src/data/services/ProfessionLookupService.ts` (ALREADY PORTED IN STORY 1)
Note: COI-MVP already has Canada HTML helpers in [coi-mvp-etl/src/generator/load/html/helpers.mjs](coi-mvp-etl/src/generator/load/html/helpers.mjs). You may reuse these helpers or provide a TypeScript wrapper (`helpers.ts`) for consistency during migration.

**Changes needed:**
- Use this service from Story 1 in transform layer

---

## Implementation Steps

### Part A: Create Configuration Structure for Extensibility

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/config/transformConfig.ts`

```typescript
/**
 * Configuration for transformation rules
 * This allows adding new geographies, LOBs, and carriers without code changes
 */

export interface TransformConfig {
  geographies: {
    [geography: string]: GeographyTransformConfig;
  };
  lobs: {
    [lob: string]: LOBTransformConfig;
  };
}

export interface GeographyTransformConfig {
  name: string;
  locale: string;  // e.g., "en-CA", "en-US"
  currency: string;  // e.g., "CAD", "USD"
  dateFormat: string;  // e.g., "yyyy/MM/dd", "MM-dd-yyyy"
  addressFormat: 'block' | 'structured';  // US uses block, Canada uses structured
  numberFormat: 'string' | 'number';  // Canada sends strings, US sends numbers
  transformers: {
    gl?: string;  // Class name or path to GL transformer
    eo?: string;  // Class name or path to EO transformer
    optionalCoverages?: string;  // Class name or path to optional coverages transformer
  };
}

export interface LOBTransformConfig {
  name: string;
  displayName: string;
  supportedGeographies: string[];
  coverageFields: {
    [geography: string]: string[];  // Fields to extract for this LOB in each geography
  };
  requiredFields: string[];
  optionalFields: string[];
}

// Configuration data - easily extensible
export const transformConfig: TransformConfig = {
  geographies: {
    CA: {
      name: 'Canada',
      locale: 'en-CA',
      currency: 'CAD',
      dateFormat: 'yyyy/MM/dd',
      addressFormat: 'structured',
      numberFormat: 'string',  // CRITICAL: Canada sends numbers as strings
      transformers: {
        gl: 'CanadaGLTransformer',
        eo: 'CanadaEOTransformer',
        optionalCoverages: 'CanadaOptionalCoveragesTransformer',
      },
    },
    US: {
      name: 'United States',
      locale: 'en-US',
      currency: 'USD',
      dateFormat: 'MM-dd-yyyy',
      addressFormat: 'block',  // Multi-line string for ACORD 25
      numberFormat: 'number',
      transformers: {
        gl: 'USGLTransformer',
        eo: 'USEOTransformer',
      },
    },
    // EXTENSIBILITY: Add new geographies here
    // UK: {
    //   name: 'United Kingdom',
    //   locale: 'en-GB',
    //   currency: 'GBP',
    //   dateFormat: 'dd/MM/yyyy',
    //   addressFormat: 'structured',
    //   numberFormat: 'number',
    //   transformers: {
    //     gl: 'UKGLTransformer',
    //   },
    // },
  },
  lobs: {
    GL: {
      name: 'GL',
      displayName: 'General Liability',
      supportedGeographies: ['CA', 'US'],
      coverageFields: {
        CA: [
          'aggregateLimit',
          'deductible',
          'occurrenceLimit',
          'medicalPaymentsLimit',
          'tenantLegalLiabilityLimit',
          'limitedPollutionLiability',
          'limitedPollutionLiabilityOccurrenceLimit',
        ],
        US: [
          'occurrenceLimit',
          'premisesRentedToYouLimit',
          'medicalPaymentsLimit',
          'aggregateLimit',
        ],
      },
      requiredFields: ['occurrenceLimit', 'aggregateLimit'],
      optionalFields: ['medicalPaymentsLimit'],
    },
    EO: {
      name: 'EO',
      displayName: 'Errors & Omissions',
      supportedGeographies: ['CA', 'US'],  // Currently only CA in old system, ready for US expansion
      coverageFields: {
        CA: [
          'miscellaneousEO',
          'miscellaneousEODeductible',
          'miscellaneousEOOccurrenceLimit',
          'miscellaneousEOAggregateLimit',
        ],
        US: [
          // EXTENSIBILITY: Define when E&O expands to US
          'eoOccurrenceLimit',
          'eoAggregateLimit',
          'eoDeductible',
        ],
      },
      requiredFields: ['miscellaneousEO'],
      optionalFields: [],
    },
    // EXTENSIBILITY: Add new LOBs here
    // BOP: {
    //   name: 'BOP',
    //   displayName: 'Business Owners Policy',
    //   supportedGeographies: ['US'],
    //   coverageFields: {
    //     US: ['propertyLimit', 'liabilityLimit', 'deductible'],
    //   },
    //   requiredFields: ['propertyLimit', 'liabilityLimit'],
    //   optionalFields: ['deductible'],
    // },
  },
};

/**
 * Get configuration for a specific geography
 */
export function getGeographyConfig(geography: string): GeographyTransformConfig {
  const config = transformConfig.geographies[geography];
  if (!config) {
    throw new Error(`Unsupported geography: ${geography}. Add configuration in transformConfig.ts`);
  }
  return config;
}

/**
 * Get configuration for a specific LOB
 */
export function getLOBConfig(lob: string): LOBTransformConfig {
  const config = transformConfig.lobs[lob];
  if (!config) {
    throw new Error(`Unsupported LOB: ${lob}. Add configuration in transformConfig.ts`);
  }
  return config;
}

/**
 * Validate that a geography supports a specific LOB
 */
export function validateGeographyLOB(geography: string, lob: string): void {
  const lobConfig = getLOBConfig(lob);
  if (!lobConfig.supportedGeographies.includes(geography)) {
    throw new Error(
      `LOB ${lob} is not supported in geography ${geography}. ` +
      `Supported geographies: ${lobConfig.supportedGeographies.join(', ')}`
    );
  }
}
```

---

### Part B: Create TypeScript Interfaces for Canonical Model

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/types.ts`

```typescript
/**
 * Canonical COI Data Model
 *
 * This is the geography-agnostic, LOB-agnostic structure that all transformations produce.
 * Template renderers (US ACORD 25, Canada HTML) consume this canonical model.
 */

/**
 * Coverage structure - generic for any LOB
 */
export interface Coverage {
  amount: number;
  deductible: number;
}

/**
 * Canada GL Coverage structure
 */
export interface CanadaGLCoverage {
  generalAggregate: Coverage;
  eachOccurrence: Coverage;
  productAndCompletedOperationsAggregate: Coverage;
  personalAndAdvertisingInjuryLiability: Coverage;
  medicalPayments: Coverage;
  tenantLegalLiability: Coverage;
  pollutionLiabilityExtension?: Coverage;
}

/**
 * Canada EO Coverage structure
 */
export interface CanadaEOCoverage {
  deductible: number;
  aggregateAmount: number;
  occurrenceAmount: number;
}

/**
 * Optional coverage item (generic structure)
 */
export interface OptionalCoverage {
  name: string;
  limit: Coverage;
}

/**
 * Canada-specific coverages
 */
export interface CanadaCoverages {
  gl?: CanadaGLCoverage;
  eo?: CanadaEOCoverage;
  others: OptionalCoverage[];
}

/**
 * US-specific limits (flat structure for ACORD 25)
 */
export interface USLimits {
  occurrenceLimit: number;
  premisesRentedToYouLimit: number;
  medicalPaymentsLimit: number;
  aggregateLimit: number;
}

/**
 * Address structure (universal)
 */
export interface Address {
  street: string;
  city: string;
  province: string;  // Or "state" - same field
  postalCode: string;  // Or "zipCode" - same field
}

/**
 * Insured information (universal)
 */
export interface Insured {
  name: string;
  address: Address;
  addressLine?: string;  // Single-line format: "Street, City, Province, PostalCode"
  block?: string;  // Multi-line format: "Name\nStreet\nCity, Province, PostalCode"
}

/**
 * Canonical COI Model
 *
 * This model is consumed by:
 * - Map layer (applies field mappings)
 * - Load layer (generates PDFs)
 * - Persistence layer (deferred in MVP)
 */
export interface CanonicalCOI {
  // Universal identifiers
  applicationId: string;
  policyFoxdenId: string;
  geography: string;  // 'US', 'CA', 'UK', etc. - extensible
  lob: string;  // 'GL', 'EO', 'BOP', etc. - extensible

  // Universal insured information
  namedInsured: string;
  insuredAddress: Address;

  // Certificate holder / Additional insured (same concept, different naming)
  additionalInsured: {
    name: string;
    address: Address;
  };

  // Universal dates
  effectiveDate: Date;
  expirationDate: Date;

  // Profession/description
  professionCodes: string[];  // Raw codes from application
  professionNames: string[];  // Human-readable names (after lookup)
  description: string;  // Formatted for display (comma-separated or custom)

  // Universal fields
  timeZone: string;
  carrierPartner: string;
  insurer: string;  // Insurance company name for display
  recipientEmail: string;

  // Geography-specific data (optional fields based on geography)
  canada?: {
    coverages: CanadaCoverages;
    provinceFullName: string;  // "Ontario" instead of "ON"
  };

  us?: {
    insuredBlock: string;  // Multi-line string for ACORD 25
    certificateNumber: number;
    policyNumber: string;
    limits: USLimits;
    stateAbbreviation: string;  // "NY" instead of "New York"
  };

  // EXTENSIBILITY: Add new geography-specific fields as needed
  // uk?: {
  //   coverages: UKCoverages;
  //   vatNumber?: string;
  // };

  // Metadata
  transformedAt: Date;
  transformVersion: string;  // Version of transform logic used
}
```

---

### Part C: Create Geography-Specific Transformers (Strategy Pattern)

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transformers/CanadaGLTransformer.ts`

```typescript
import { CanadaGLCoverage, Coverage, OptionalCoverage } from '../types.js';

/**
 * Canada GL Coverage Transformer
 * Ported from: sendCertificateOfInsurance.ts:90-203
 *
 * CRITICAL: Canada sends all numbers as strings - must convert to numbers
 */
export class CanadaGLTransformer {
  /**
   * Transform Canada GL rating input to canonical GL coverage structure
   */
  transform(glInput: any): {
    gl: CanadaGLCoverage;
    optionalCoverages: OptionalCoverage[];
  } {
    // Extract all fields (they come as strings or numbers)
    const {
      aggregateLimit: aggregateLimitUnknown,
      deductible: deductibleUnknown,
      limitedCoverageForUnmannedAircraft,
      limitedCoverageForUnmannedAircraftLimit: limitedCoverageForUnmannedAircraftLimitUnknown,
      limitedPollutionLiability,
      limitedPollutionLiabilityOccurrenceLimit: limitedPollutionLiabilityOccurrenceLimitUnknown,
      medicalPaymentsLimit: medicalPaymentsLimitUnknown,
      occurrenceLimit: occurrenceLimitUnknown,
      tenantLegalLiabilityLimit: tenantLegalLiabilityLimitUnknown,
    } = glInput;

    // Validate boolean flags
    this.validateBoolean(limitedPollutionLiability, 'limitedPollutionLiability');
    this.validateBoolean(limitedCoverageForUnmannedAircraft, 'limitedCoverageForUnmannedAircraft');

    // CRITICAL: Convert strings to numbers (Canada sends as strings)
    const aggregateLimit = this.toNumber(aggregateLimitUnknown, 'aggregateLimit');
    const deductible = this.toNumber(deductibleUnknown, 'deductible');
    const limitedPollutionLiabilityOccurrenceLimit = this.toNumber(
      limitedPollutionLiabilityOccurrenceLimitUnknown,
      'limitedPollutionLiabilityOccurrenceLimit'
    );
    const medicalPaymentsLimit = this.toNumber(medicalPaymentsLimitUnknown, 'medicalPaymentsLimit');
    const occurrenceLimit = this.toNumber(occurrenceLimitUnknown, 'occurrenceLimit');
    const tenantLegalLiabilityLimit = this.toNumber(tenantLegalLiabilityLimitUnknown, 'tenantLegalLiabilityLimit');
    const limitedCoverageForUnmannedAircraftLimit = this.toNumber(
      limitedCoverageForUnmannedAircraftLimitUnknown,
      'limitedCoverageForUnmannedAircraftLimit'
    );

    // Build GL coverage structure (EXACT COPY from old system lines 166-200)
    const gl: CanadaGLCoverage = {
      generalAggregate: {
        amount: aggregateLimit,
        deductible: deductible,
      },
      eachOccurrence: {
        amount: occurrenceLimit,
        deductible: deductible,
      },
      productAndCompletedOperationsAggregate: {
        amount: occurrenceLimit,
        deductible: deductible,
      },
      personalAndAdvertisingInjuryLiability: {
        amount: occurrenceLimit,
        deductible: deductible,
      },
      medicalPayments: {
        amount: medicalPaymentsLimit,
        deductible: deductible,
      },
      tenantLegalLiability: {
        amount: tenantLegalLiabilityLimit,
        deductible: deductible,
      },
      ...(limitedPollutionLiability
        ? {
            pollutionLiabilityExtension: {
              amount: limitedPollutionLiabilityOccurrenceLimit,
              deductible: deductible,
            },
          }
        : {}),
    };

    // Build optional coverages array
    const optionalCoverages: OptionalCoverage[] = [];

    if (limitedCoverageForUnmannedAircraft) {
      optionalCoverages.push({
        name: 'Unmanned aircraft',
        limit: {
          amount: limitedCoverageForUnmannedAircraftLimit,
          deductible,
        },
      });
    }

    return { gl, optionalCoverages };
  }

  /**
   * Convert unknown type to number (handles string conversion)
   */
  private toNumber(value: unknown, fieldName: string): number {
    const num = Number(value);
    if (isNaN(num)) {
      throw new Error(`Invalid number for field ${fieldName}: ${value}`);
    }
    return num;
  }

  /**
   * Validate that a value is a boolean
   */
  private validateBoolean(value: unknown, fieldName: string): void {
    if (typeof value !== 'boolean') {
      throw new Error(`Field ${fieldName} must be a boolean, got ${typeof value}`);
    }
  }
}
```

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transformers/CanadaEOTransformer.ts`

```typescript
import { CanadaEOCoverage } from '../types.js';

/**
 * Canada EO Coverage Transformer
 * Ported from: sendCertificateOfInsurance.ts:142-148
 */
export class CanadaEOTransformer {
  /**
   * Transform Canada EO rating input to canonical EO coverage structure
   */
  transform(glInput: any): CanadaEOCoverage | undefined {
    const {
      miscellaneousEO,
      miscellaneousEODeductible: miscellaneousEODeductibleUnknown,
      miscellaneousEOOccurrenceLimit: miscellaneousEOOccurrenceLimitUnknown,
      miscellaneousEOAggregateLimit: miscellaneousEOAggregateLimitUnknown,
    } = glInput;

    // Validate boolean flag
    if (typeof miscellaneousEO !== 'boolean') {
      throw new Error('miscellaneousEO must be a boolean');
    }

    // Only build EO coverage if flag is true
    if (!miscellaneousEO) {
      return undefined;
    }

    // Convert strings to numbers
    const miscellaneousEODeductible = Number(miscellaneousEODeductibleUnknown);
    const miscellaneousEOAggregateLimit = Number(miscellaneousEOAggregateLimitUnknown);
    const miscellaneousEOOccurrenceLimit = Number(miscellaneousEOOccurrenceLimitUnknown);

    return {
      deductible: miscellaneousEODeductible,
      aggregateAmount: miscellaneousEOAggregateLimit,
      occurrenceAmount: miscellaneousEOOccurrenceLimit,
    };
  }
}
```

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transformers/USGLTransformer.ts`

```typescript
import { USLimits } from '../types.js';

/**
 * US GL Coverage Transformer
 * Ported from: sendUsCertificateOfInsurance.ts:107-122
 */
export class USGLTransformer {
  /**
   * Transform US GL rating input to canonical US limits structure
   */
  transform(glRatingInput: any): USLimits {
    // US sends numbers directly (not strings like Canada)
    return {
      occurrenceLimit: glRatingInput.occurrenceLimit,
      premisesRentedToYouLimit: glRatingInput.premisesRentedToYouLimit,
      medicalPaymentsLimit: glRatingInput.medicalPaymentsLimit,
      aggregateLimit: glRatingInput.aggregateLimit,
    };
  }
}
```

---

### Part D: Create Formatters (Reusable Utilities)

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/formatters/AddressFormatter.ts`

```typescript
import { Address } from '../types.js';
import { GeographyTransformConfig } from '../../config/transformConfig.js';

/**
 * Address formatting utilities
 */
export class AddressFormatter {
  /**
   * Format address as single line: "Street, City, Province, PostalCode"
   */
  static formatLine(address: Address): string {
    const parts = [address.street, address.city, address.province, address.postalCode].filter(Boolean);
    return parts.join(', ');
  }

  /**
   * Format address as multi-line block (for US ACORD 25)
   * Ported from: sendUsCertificateOfInsurance.ts:108
   */
  static formatBlock(namedInsured: string, address: Address): string {
    return `${namedInsured}\n${address.street}\n${address.city}, ${address.province}, ${address.postalCode}`;
  }

  /**
   * Format address based on geography configuration
   */
  static format(namedInsured: string, address: Address, config: GeographyTransformConfig): string {
    if (config.addressFormat === 'block') {
      return this.formatBlock(namedInsured, address);
    } else {
      return this.formatLine(address);
    }
  }
}
```

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/formatters/ProfessionFormatter.ts`

```typescript
/**
 * Profession formatting utilities
 */
export class ProfessionFormatter {
  /**
   * Format profession list as comma-separated string
   * Ported from: sendUsCertificateOfInsurance.ts:117
   */
  static formatList(professionList: string[], delimiter: string = ', '): string {
    if (!professionList || professionList.length === 0) {
      return '';
    }
    return professionList.join(delimiter);
  }
}
```

---

### Part E: Main Transform Function (ETL Transform Step)

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transform.ts`

```typescript
import { generateNamedInsured } from '../../data/utils/generateNamedInsured.js';
import { CanonicalCOI } from './types.js';
import { getGeographyConfig, getLOBConfig, validateGeographyLOB } from '../config/transformConfig.js';
import { CanadaGLTransformer } from './transformers/CanadaGLTransformer.js';
import { CanadaEOTransformer } from './transformers/CanadaEOTransformer.js';
import { USGLTransformer } from './transformers/USGLTransformer.js';
import { AddressFormatter } from './formatters/AddressFormatter.js';
import { ProfessionFormatter } from './formatters/ProfessionFormatter.js';

/**
 * TRANSFORM LAYER (ETL Step 2)
 *
 * Converts raw extracted data to canonical model.
 * This layer is configuration-driven and extensible.
 *
 * To add a new geography:
 * 1. Add geography config in transformConfig.ts
 * 2. Create geography-specific transformer classes
 * 3. Register transformers in factory below
 *
 * To add a new LOB:
 * 1. Add LOB config in transformConfig.ts
 * 2. Create LOB-specific transformer classes
 * 3. Register transformers in factory below
 */

/**
 * Main transform function - routes to geography-specific transformers
 */
export async function transform(extractedData: any): Promise<CanonicalCOI> {
  const { geography, lob } = extractedData;

  // Validate configuration
  validateGeographyLOB(geography, lob);

  const geographyConfig = getGeographyConfig(geography);
  const lobConfig = getLOBConfig(lob);

  // Route to appropriate transformer based on geography
  if (geography === 'CA') {
    return transformCanada(extractedData, geographyConfig, lobConfig);
  } else if (geography === 'US') {
    return transformUS(extractedData, geographyConfig, lobConfig);
  } else {
    // EXTENSIBILITY: Add new geographies here
    throw new Error(
      `Geography ${geography} is not yet implemented. ` +
      `Add transformer in transform.ts and update transformConfig.ts`
    );
  }
}

/**
 * Transform Canada data to canonical model
 */
function transformCanada(extracted: any, geoConfig: any, lobConfig: any): CanonicalCOI {
  const {
    policyFoxdenId,
    lob,
    businessName,
    dbaName,
    namedInsuredAddress,
    professionList,
    timeZone,
    effectiveDate,
    expiryDate,
    carrierPartner,
    recipientEmail,
    additionalInsured,
    ratingInput,
  } = extracted;

  // Generate named insured (uses helper from Story 1)
  const namedInsured = generateNamedInsured(businessName, dbaName);

  // Transform GL coverage (configuration-driven)
  let canadaCoverages: any = { others: [] };

  if (lob === 'GL' || ratingInput.GL) {
    const glTransformer = new CanadaGLTransformer();
    const { gl, optionalCoverages } = glTransformer.transform(ratingInput.GL);
    canadaCoverages.gl = gl;
    canadaCoverages.others = optionalCoverages;

    // Check for EO coverage (part of GL in Canada)
    const eoTransformer = new CanadaEOTransformer();
    const eo = eoTransformer.transform(ratingInput.GL);
    if (eo) {
      canadaCoverages.eo = eo;
    }
  }

  // Format profession list (configuration-driven delimiter)
  const description = ProfessionFormatter.formatList(professionList);

  // Build canonical model
  return {
    // Universal identifiers
    applicationId: extracted.applicationId || policyFoxdenId,
    policyFoxdenId,
    geography: 'CA',
    lob,

    // Universal insured information
    namedInsured,
    insuredAddress: namedInsuredAddress,
    additionalInsured,

    // Universal dates
    effectiveDate: new Date(effectiveDate),
    expirationDate: new Date(expiryDate),

    // Profession/description
    professionCodes: professionList,
    professionNames: professionList,  // Will be converted in load layer
    description,

    // Universal fields
    timeZone,
    carrierPartner,
    insurer: 'Foxquilt',  // Default for Canada
    recipientEmail,

    // Canada-specific data
    canada: {
      coverages: canadaCoverages,
      provinceFullName: '',  // Will be populated by load layer helper
    },

    // Metadata
    transformedAt: new Date(),
    transformVersion: '2.0',
  };
}

/**
 * Transform US data to canonical model
 */
function transformUS(extracted: any, geoConfig: any, lobConfig: any): CanonicalCOI {
  const {
    policyFoxdenId,
    lob,
    businessName,
    dbaName,
    businessAddress,
    professionList,
    timeZone,
    carrierPartner,
    recipientEmail,
    additionalInsured,
    certificateNumber,
    policyNumber,
    ratingInput,
  } = extracted;

  // Generate named insured (uses helper from Story 1)
  const namedInsured = generateNamedInsured(businessName, dbaName);

  // Format insured block (configuration-driven)
  const insuredBlock = AddressFormatter.format(namedInsured, businessAddress, geoConfig);

  // Format profession list (configuration-driven)
  const description = ProfessionFormatter.formatList(professionList);

  // Transform limits based on LOB
  let usLimits: any;

  if (lob === 'GL' || ratingInput.GL) {
    const glTransformer = new USGLTransformer();
    usLimits = glTransformer.transform(ratingInput.GL);
  } else if (lob === 'EO' || ratingInput.EO) {
    // EXTENSIBILITY: Add US EO transformer when E&O expands to US
    throw new Error('US E&O transformer not yet implemented. Add USEOTransformer.ts');
  }

  // Extract dates from rating input (use quote dates, NOT policy dates)
  const lobRating = ratingInput[lob];
  if (!lobRating) {
    throw new Error(`No rating input found for LOB: ${lob}`);
  }

  const effectiveDate = new Date(lobRating.policyEffectiveDate);
  const expirationDate = new Date(lobRating.policyExpirationDate);

  // Build canonical model
  return {
    // Universal identifiers
    applicationId: extracted.applicationId || policyFoxdenId,
    policyFoxdenId,
    geography: 'US',
    lob,

    // Universal insured information
    namedInsured,
    insuredAddress: businessAddress,
    additionalInsured,

    // Universal dates
    effectiveDate,
    expirationDate,

    // Profession/description
    professionCodes: professionList,
    professionNames: professionList,
    description,

    // Universal fields
    timeZone,
    carrierPartner,
    insurer: carrierPartner,  // For US, insurer = carrier partner
    recipientEmail,

    // US-specific data
    us: {
      insuredBlock,
      certificateNumber,
      policyNumber,
      limits: usLimits,
      stateAbbreviation: businessAddress.province,
    },

    // Metadata
    transformedAt: new Date(),
    transformVersion: '2.0',
  };
}
```

---

### Part F: Update Pipeline to Use New Transform

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/pipeline/runPipeline.ts`

```typescript
import { Db } from 'mongodb';
import { extract } from '../extract/extract.js';
import { transform } from '../transform/transform.js';
import { mapData } from '../map/map.js';
import { loadPdf } from '../load/loadPdf.js';

/**
 * ETL Pipeline for COI Generation
 *
 * This follows the ETL (Extract-Transform-Load) pattern:
 * 1. Extract: Fetch raw data from MongoDB
 * 2. Transform: Convert to canonical model
 * 3. Map: Apply field mappings from configuration
 * 4. Load: Generate PDF
 */
export async function runPipeline(db: Db, extractInput: any, config: any) {
  // EXTRACT - Get raw data from MongoDB (Story 1)
  const extracted = await extract(db, extractInput);

  // TRANSFORM - Build canonical model (THIS STORY)
  const canonical = await transform(extracted);

  // MAP - Apply field mappings from configuration
  const mapped = mapData(canonical, config);

  // LOAD - Generate PDF
  const pdf = await loadPdf(mapped, config);

  return { pdfBytes: pdf, canonical };
}
```

---

### Part G: Update Map Layer to Handle New Canonical Structure

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/map/map.ts`

```typescript
import get from 'lodash.get';
import { CanonicalCOI } from '../transform/types.js';

/**
 * MAP LAYER (ETL Step 3)
 *
 * Maps canonical model to template-specific field names using configuration.
 * This allows same canonical model to be rendered by different templates.
 */
export function mapData(canonical: CanonicalCOI, config: any): any {
  const { fieldMappings } = config;

  const mapped: any = {};

  // Apply configured field mappings
  for (const [targetField, sourcePath] of Object.entries(fieldMappings)) {
    const value = get(canonical, sourcePath as string);

    // Only set if value exists (don't add null/undefined fields)
    if (value !== undefined && value !== null) {
      mapped[targetField] = value;
    }
  }

  // Add geography-specific mappings
  if (canonical.geography === 'US') {
    // US-specific fields for ACORD 25
    mapped.insured = canonical.us?.insuredBlock;
    mapped.certificateNumber = canonical.us?.certificateNumber;
    mapped.policyNumber = canonical.us?.policyNumber;
    mapped.occurrenceLimit = canonical.us?.limits.occurrenceLimit;
    mapped.premisesRentedToYouLimit = canonical.us?.limits.premisesRentedToYouLimit;
    mapped.medicalPaymentsLimit = canonical.us?.limits.medicalPaymentsLimit;
    mapped.aggregateLimit = canonical.us?.limits.aggregateLimit;
  } else if (canonical.geography === 'CA') {
    // Canada-specific fields for HTML template
    mapped.coverages = canonical.canada?.coverages;
  }

  // Common fields (all geographies)
  mapped.namedInsured = canonical.namedInsured;
  mapped.additionalInsured = canonical.additionalInsured;
  mapped.effectiveDate = canonical.effectiveDate;
  mapped.expirationDate = canonical.expirationDate;
  mapped.description = canonical.description;
  mapped.recipientEmail = canonical.recipientEmail;
  mapped.timeZone = canonical.timeZone;
  mapped.carrierPartner = canonical.carrierPartner;
  mapped.geography = canonical.geography;
  mapped.lob = canonical.lob;

  return mapped;
}
```

---

### Part H: Create Canada HTML Helpers (Load Layer)

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/load/canada/helpers.ts`

```typescript
import { format } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

/**
 * LOAD LAYER HELPERS (ETL Step 4)
 *
 * Handlebars helpers for Canada HTML PDF generation
 * Ported from: generate.ts:86-117
 */

/**
 * Format currency as CAD
 * Ported from: generate.ts:93-104
 */
export function formatCurrency(value: unknown): string {
  const num = Number(value);
  if (isNaN(num)) {
    return '$0';
  }

  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format date for Canada COI (yyyy/MM/dd)
 * Ported from: generate.ts:105
 */
export function formatDate(date: Date | string, timeZone: string): string {
  if (typeof date === 'string') {
    date = new Date(date);
  }

  // Format as yyyy/MM/dd in the specified time zone
  return formatInTimeZone(date, timeZone, 'yyyy/MM/dd');
}

/**
 * Convert province abbreviation to full name
 * Ported from: generate.ts:106-113
 */
export function toLongProvinceName(abbrev: string): string {
  const provinceMap: Record<string, string> = {
    'AB': 'Alberta',
    'BC': 'British Columbia',
    'MB': 'Manitoba',
    'NB': 'New Brunswick',
    'NL': 'Newfoundland and Labrador',
    'NS': 'Nova Scotia',
    'ON': 'Ontario',
    'PE': 'Prince Edward Island',
    'QC': 'Quebec',
    'SK': 'Saskatchewan',
    'NT': 'Northwest Territories',
    'NU': 'Nunavut',
    'YT': 'Yukon',
  };

  const fullName = provinceMap[abbrev];
  if (!fullName) {
    throw new Error(`Unknown province abbreviation: ${abbrev}`);
  }

  return fullName;
}

/**
 * Register all Handlebars helpers for Canada HTML generation
 */
export function registerCanadaHelpers(Handlebars: any, timeZone: string): void {
  Handlebars.registerHelper('formatCurrency', formatCurrency);
  Handlebars.registerHelper('formatDate', (date: Date | string) => formatDate(date, timeZone));
  Handlebars.registerHelper('toLongProvinceName', toLongProvinceName);
}
```

---

## Integration Points

### ETL Pipeline Flow

```
1. EXTRACT Layer (Story 1)
   Input: { policyFoxdenId, lob, geography, additionalInsured }
   Output: extractedData
   - Fetches raw data from MongoDB
   - Canada: ratingInput with string numbers
   - US: ratingInput with number limits

2. TRANSFORM Layer (THIS STORY)
   Input: extractedData
   Output: canonical (CanonicalCOI)
   - Routes to geography-specific transformer (configuration-driven)
   - Canada: buildCanadaCoverages() → structured GL/EO/others
   - US: formatUSInsuredBlock() → multi-line string
   - Produces geography-agnostic canonical model

3. MAP Layer
   Input: canonical (CanonicalCOI)
   Output: mapped
   - Applies field mappings from configuration
   - Maps canonical fields to template-specific field names

4. LOAD Layer
   Input: mapped
   Output: pdfBytes
   - Canada: HTML → Browserless → PDF (uses Handlebars helpers)
   - US: Fill ACORD 25 PDF form fields
```

### Configuration-Driven Extensibility

```
To add new geography (e.g., UK):
1. Add UK config in transformConfig.ts
2. Create UKGLTransformer.ts, UKEOTransformer.ts
3. Update transform.ts to route to UK transformers
4. No changes needed to Extract, Map, or Load layers

To add new LOB (e.g., BOP):
1. Add BOP config in transformConfig.ts
2. Create BOPTransformer.ts for each geography
3. Update transform.ts to handle BOP
4. Add BOP template in Load layer

To add new carrier:
- Already supported via carrierPartner field in canonical model
- Carrier-specific logic (signatures, forms) in Load layer only
```

### Dependencies on Other Stories

**Depends on:**
- **Story 1 (Data Layer)** - Provides:
  - `generateNamedInsured()` helper
  - `CanadaRatingInput` and `UsCommonRatingInput` types
  - Extracted data structure
  - MongoDB data extraction

**Used by:**
- **Story 3 (Configuration)** - Uses transformConfig.ts
- **Story 5 (Email)** - Uses canonical data for email generation

---

## Testing Strategy

### Unit Tests

```typescript
// test/transform/canada/CanadaGLTransformer.test.ts
describe('CanadaGLTransformer', () => {
  test('should convert string numbers to actual numbers', () => {
    const transformer = new CanadaGLTransformer();
    const input = {
      aggregateLimit: "5000000",
      deductible: "2500",
      occurrenceLimit: "2000000",
      medicalPaymentsLimit: "5000",
      tenantLegalLiabilityLimit: "2000000",
      limitedPollutionLiability: false,
      limitedCoverageForUnmannedAircraft: false,
    };

    const result = transformer.transform(input);

    expect(result.gl.generalAggregate.amount).toBe(5000000);
    expect(result.gl.generalAggregate.deductible).toBe(2500);
    expect(typeof result.gl.generalAggregate.amount).toBe('number');
  });

  test('should add pollution extension when flag is true', () => {
    const transformer = new CanadaGLTransformer();
    const input = {
      aggregateLimit: "5000000",
      deductible: "2500",
      occurrenceLimit: "2000000",
      medicalPaymentsLimit: "5000",
      tenantLegalLiabilityLimit: "2000000",
      limitedPollutionLiability: true,
      limitedPollutionLiabilityOccurrenceLimit: "500000",
      limitedCoverageForUnmannedAircraft: false,
    };

    const result = transformer.transform(input);

    expect(result.gl.pollutionLiabilityExtension).toBeDefined();
    expect(result.gl.pollutionLiabilityExtension?.amount).toBe(500000);
  });

  test('should add unmanned aircraft to optional coverages', () => {
    const transformer = new CanadaGLTransformer();
    const input = {
      aggregateLimit: "5000000",
      deductible: "2500",
      occurrenceLimit: "2000000",
      medicalPaymentsLimit: "5000",
      tenantLegalLiabilityLimit: "2000000",
      limitedPollutionLiability: false,
      limitedCoverageForUnmannedAircraft: true,
      limitedCoverageForUnmannedAircraftLimit: "1000000",
    };

    const result = transformer.transform(input);

    expect(result.optionalCoverages).toHaveLength(1);
    expect(result.optionalCoverages[0].name).toBe('Unmanned aircraft');
    expect(result.optionalCoverages[0].limit.amount).toBe(1000000);
  });
});

// test/transform/us/USGLTransformer.test.ts
describe('USGLTransformer', () => {
  test('should extract US limits correctly', () => {
    const transformer = new USGLTransformer();
    const input = {
      occurrenceLimit: 1000000,
      premisesRentedToYouLimit: 300000,
      medicalPaymentsLimit: 5000,
      aggregateLimit: 2000000,
    };

    const result = transformer.transform(input);

    expect(result.occurrenceLimit).toBe(1000000);
    expect(result.premisesRentedToYouLimit).toBe(300000);
    expect(result.medicalPaymentsLimit).toBe(5000);
    expect(result.aggregateLimit).toBe(2000000);
  });
});

// test/transform/formatters/AddressFormatter.test.ts
describe('AddressFormatter', () => {
  test('should format US insured block as multi-line string', () => {
    const namedInsured = 'Acme Corp DBA Acme Services';
    const address = {
      street: '123 Main St',
      city: 'New York',
      province: 'NY',
      postalCode: '10001'
    };

    const result = AddressFormatter.formatBlock(namedInsured, address);

    expect(result).toBe('Acme Corp DBA Acme Services\n123 Main St\nNew York, NY, 10001');
  });

  test('should format address line', () => {
    const address = {
      street: '123 Main St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M1A 1A1'
    };

    const result = AddressFormatter.formatLine(address);

    expect(result).toBe('123 Main St, Toronto, ON, M1A 1A1');
  });
});

// test/transform/config/transformConfig.test.ts
describe('Transform Configuration', () => {
  test('should load Canada geography config', () => {
    const config = getGeographyConfig('CA');

    expect(config.name).toBe('Canada');
    expect(config.numberFormat).toBe('string');
    expect(config.addressFormat).toBe('structured');
    expect(config.currency).toBe('CAD');
  });

  test('should load US geography config', () => {
    const config = getGeographyConfig('US');

    expect(config.name).toBe('United States');
    expect(config.numberFormat).toBe('number');
    expect(config.addressFormat).toBe('block');
    expect(config.currency).toBe('USD');
  });

  test('should validate geography-LOB combinations', () => {
    expect(() => validateGeographyLOB('CA', 'GL')).not.toThrow();
    expect(() => validateGeographyLOB('US', 'GL')).not.toThrow();
  });

  test('should throw for unsupported geography', () => {
    expect(() => getGeographyConfig('UK')).toThrow('Unsupported geography: UK');
  });
});
```

### Integration Tests

```typescript
// test/integration/transform-pipeline.test.ts
describe('Transform Pipeline Integration', () => {
  test('should transform Canada extracted data to canonical model', async () => {
    const extractedData = {
      policyFoxdenId: 'POL-123',
      geography: 'CA',
      lob: 'GL',
      businessName: 'Acme Corp',
      dbaName: 'Acme Services',
      namedInsuredAddress: {
        street: '123 Main St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M1A 1A1'
      },
      professionList: ['ARCH_PROF'],
      timeZone: 'America/Toronto',
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2025-01-01'),
      carrierPartner: 'Foxquilt',
      recipientEmail: 'user@example.com',
      additionalInsured: {
        name: 'Big Bank Ltd',
        address: {
          street: '1 Bank St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M1B 1B1'
        }
      },
      ratingInput: {
        GL: {
          aggregateLimit: "5000000",
          deductible: "2500",
          occurrenceLimit: "2000000",
          medicalPaymentsLimit: "5000",
          tenantLegalLiabilityLimit: "2000000",
          limitedPollutionLiability: false,
          limitedCoverageForUnmannedAircraft: false,
          miscellaneousEO: true,
          miscellaneousEODeductible: "5000",
          miscellaneousEOOccurrenceLimit: "1000000",
          miscellaneousEOAggregateLimit: "2000000",
        }
      }
    };

    const canonical = await transform(extractedData);

    // Verify structure
    expect(canonical.geography).toBe('CA');
    expect(canonical.namedInsured).toBe('Acme Corp DBA Acme Services');

    // Verify Canada-specific data
    expect(canonical.canada).toBeDefined();
    expect(canonical.canada?.coverages.gl?.generalAggregate.amount).toBe(5000000);
    expect(canonical.canada?.coverages.eo).toBeDefined();
    expect(canonical.canada?.coverages.eo?.aggregateAmount).toBe(2000000);
  });

  test('should transform US extracted data to canonical model', async () => {
    const extractedData = {
      policyFoxdenId: 'POL-456',
      geography: 'US',
      lob: 'GL',
      businessName: 'Acme Corp',
      dbaName: null,
      businessAddress: {
        street: '123 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001'
      },
      professionList: ['Architect', 'Engineer'],
      timeZone: 'America/New_York',
      carrierPartner: 'StateNational',
      recipientEmail: 'user@example.com',
      additionalInsured: {
        name: 'Big Bank Ltd',
        address: {
          street: '1 Bank St',
          city: 'New York',
          province: 'NY',
          postalCode: '10002'
        }
      },
      certificateNumber: 123,
      policyNumber: 'POL-GL-456',
      ratingInput: {
        GL: {
          policyEffectiveDate: new Date('2024-01-01'),
          policyExpirationDate: new Date('2025-01-01'),
          occurrenceLimit: 1000000,
          premisesRentedToYouLimit: 300000,
          medicalPaymentsLimit: 5000,
          aggregateLimit: 2000000,
        }
      }
    };

    const canonical = await transform(extractedData);

    // Verify structure
    expect(canonical.geography).toBe('US');
    expect(canonical.namedInsured).toBe('Acme Corp');

    // Verify US-specific data
    expect(canonical.us).toBeDefined();
    expect(canonical.us?.insuredBlock).toBe('Acme Corp\n123 Main St\nNew York, NY, 10001');
    expect(canonical.us?.limits.occurrenceLimit).toBe(1000000);
    expect(canonical.us?.certificateNumber).toBe(123);
  });
});
```

### Regression Tests

```typescript
// test/regression/transform-regression.test.ts
describe('Transform Regression Tests', () => {
  test('Canada transformation should match old system output', async () => {
    const productionData = loadFixture('canada-gl-production.json');

    const newCanonical = await transform(productionData);

    const oldOutput = loadFixture('canada-gl-expected.json');

    // Compare coverage structures
    expect(newCanonical.canada?.coverages.gl).toEqual(oldOutput.coverages.gl);
    expect(newCanonical.canada?.coverages.eo).toEqual(oldOutput.coverages.eo);
    expect(newCanonical.canada?.coverages.others).toEqual(oldOutput.coverages.others);
  });

  test('US transformation should match old system output', async () => {
    const productionData = loadFixture('us-gl-production.json');

    const newCanonical = await transform(productionData);

    const oldOutput = loadFixture('us-gl-expected.json');

    expect(newCanonical.us?.insuredBlock).toBe(oldOutput.insured);
    expect(newCanonical.us?.limits).toEqual({
      occurrenceLimit: oldOutput.occurrenceLimit,
      premisesRentedToYouLimit: oldOutput.premisesRentedToYouLimit,
      medicalPaymentsLimit: oldOutput.medicalPaymentsLimit,
      aggregateLimit: oldOutput.aggregateLimit,
    });
  });
});
```

---

## Summary of Changes

| Action | File | Description |
|--------|------|-------------|
| CREATE | `src/generator/config/transformConfig.ts` | Configuration for geographies, LOBs, and extensibility |
| CREATE | `src/generator/transform/types.ts` | TypeScript interfaces for canonical model |
| REPLACE | `src/generator/transform/transform.mjs` to `transform.ts` | Main transform function with geography routing |
| CREATE | `src/generator/transform/transformers/CanadaGLTransformer.ts` | Canada GL coverage transformer |
| CREATE | `src/generator/transform/transformers/CanadaEOTransformer.ts` | Canada EO coverage transformer |
| CREATE | `src/generator/transform/transformers/USGLTransformer.ts` | US GL limits transformer |
| CREATE | `src/generator/transform/formatters/AddressFormatter.ts` | Address formatting utilities |
| CREATE | `src/generator/transform/formatters/ProfessionFormatter.ts` | Profession formatting utilities |
| CREATE | `src/generator/load/canada/helpers.ts` | Handlebars helpers for Canada HTML |
| MODIFY | `src/generator/pipeline/runPipeline.mjs` to `runPipeline.ts` | Use new transform function |
| MODIFY | `src/generator/map/map.mjs` to `map.ts` | Handle new canonical structure |

---

## Code Reuse from Old System

### Exact Copies (Minimal Adaptation)
1. **Canada GL Coverage Builder** (lines 90-203) - `CanadaGLTransformer.transform()`
   - String-to-number conversion logic: EXACT COPY
   - Coverage structure building: EXACT COPY
   - Boolean flag validation: EXACT COPY

2. **Canada EO Coverage Builder** (lines 142-148) - `CanadaEOTransformer.transform()`
   - Conditional EO building: EXACT COPY

3. **US Insured Block Formatter** (line 108) - `AddressFormatter.formatBlock()`
   - EXACT COPY (one line)

4. **Profession List Formatter** (line 117) - `ProfessionFormatter.formatList()`
   - EXACT COPY (one line)

5. **Handlebars Helpers** (lines 86-117) - `helpers.ts`
   - formatCurrency: EXACT COPY
   - formatDate: EXACT COPY
   - toLongProvinceName: EXACT COPY

### Adaptations
1. **generateNamedInsured** - Already ported in Story 1 (EXACT COPY)
2. **Canonical Model** - New structure, but preserves all old system data
3. **Configuration** - New extensibility layer for business growth

---

## Extensibility Examples

### Adding E&O for US (New LOB in Existing Geography)

**Step 1:** Update `transformConfig.ts`:
```typescript
lobs: {
  EO: {
    supportedGeographies: ['CA', 'US'],  // Add US
    coverageFields: {
      US: [
        'eoOccurrenceLimit',
        'eoAggregateLimit',
        'eoDeductible',
      ],
    },
  },
}
```

**Step 2:** Create `src/generator/transform/transformers/USEOTransformer.ts`:
```typescript
export class USEOTransformer {
  transform(eoRatingInput: any) {
    return {
      occurrenceLimit: eoRatingInput.eoOccurrenceLimit,
      aggregateLimit: eoRatingInput.eoAggregateLimit,
      deductible: eoRatingInput.eoDeductible,
    };
  }
}
```

**Step 3:** Update `transform.ts` to use `USEOTransformer` when `lob === 'EO'`.

**No changes needed** to Extract, Map, or Load layers.

### Adding New Geography (e.g., UK)

**Step 1:** Update `transformConfig.ts`:
```typescript
geographies: {
  UK: {
    name: 'United Kingdom',
    locale: 'en-GB',
    currency: 'GBP',
    dateFormat: 'dd/MM/yyyy',
    addressFormat: 'structured',
    numberFormat: 'number',
    transformers: {
      gl: 'UKGLTransformer',
    },
  },
}
```

**Step 2:** Create `src/generator/transform/transformers/UKGLTransformer.ts`.

**Step 3:** Update `transform.ts` to route to UK transformers.

**Step 4:** Add UK template in Load layer.

---

## Next Steps

After completing this story:
1. Transform layer will handle both US and Canada data correctly
2. String-to-number conversion for Canada will work
3. Structured GL/EO/optional coverages for Canada will be built
4. US insured block formatting will match old system
5. Configuration-driven approach ready for business expansion
6. Ready for Story 3 (Configuration enhancement)

---

**Implementation Time Estimate:** 1.5-2 weeks
**Risk Level:** Low (porting proven code with configuration layer)
**Testing Priority:** High (regression tests against old system)
**Extensibility:** High (ready for new geographies and LOBs)
