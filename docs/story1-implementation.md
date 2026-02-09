# Story 1: Data Layer & MongoDB Integration (REWRITTEN)

**Story ID:** COI-1
**Priority:** High
**Story Points:** 8
**Phase:** 1 - Foundation
**Epic:** COI-2024

## Description

Port existing, proven MongoDB data extraction functions from foxden-policy-document-backend into coi-mvp-etl. Set up TypeScript, remove MVP fixture code, and integrate ported functions with the existing ETL pipeline.

Doc-only update: This guide specifies the exact sources and targets for porting (no code changes applied at this time). Canada and US COI entry points to reference:
- Canada COI: [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
- US COI: [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)

**IMPORTANT:** This story focuses on **PORTING existing code**, not writing new code from scratch. Copy and adapt proven functions that run in production.

---

## What Will Change in COI-MVP-ETL

### Files to DELETE (Remove MVP Fixtures)
- [REMOVE] **DELETE:** `/home/hestergong/Downloads/coi-mvp-etl/src/fixtures.mjs` (entire file - lines 1-153)
- [REMOVE] **DELETE:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/extract/fixtures.mjs` (if exists)

### Files to CREATE (New Data Layer)
```
/home/hestergong/Downloads/coi-mvp-etl/
├── src/
│   └── data/                           ← NEW DIRECTORY
│       ├── client/
│       │   └── MongoDbClient.ts        ← NEW: MongoDB connection wrapper
│       ├── services/
│       │   ├── PolicyDataExtractor.ts  ← NEW: Port findPolicyHead
│       │   ├── ProfessionLookupService.ts  ← NEW: Port getProfessionNameList
│       │   ├── PolicyMetadataService.ts    ← NEW: Port getLatestActivePolicy
│       │   └── CarrierInfoService.ts       ← NEW: Port getCarrierFromPolicy
│       ├── utils/
│       │   ├── generateNamedInsured.ts     ← NEW: Port from old system
│       │   └── getPolicyIdByLineOfBusiness.ts ← NEW: Port from old system
│       └── types/
│           └── PolicyView.ts               ← NEW: TypeScript interfaces
├── tsconfig.json                       ← NEW: TypeScript configuration
└── .env                                ← MODIFY: Add MONGODB_URI
```

### Files to MODIFY (Update Extract Layer)
- [MODIFY] **MODIFY:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/extract/extract.mjs`
  - Rename to `extract.ts` (TypeScript)
  - Remove `getPolicyFromCollection` and `getCoveragesForLob` (fixture functions)
  - Replace with real MongoDB extraction using `PolicyDataExtractor`
  - Add `extractCanadaData()` and `extractUSData()` functions
  - Use `carrierPartner || defaultCarrierPartner` (fallback) and gate on `QuoteKind.Original` (matches old system)

- [MODIFY] **MODIFY:** `/home/hestergong/Downloads/coi-mvp-etl/src/index.mjs`
  - Rename to `index.ts` (TypeScript)
  - Remove hardcoded test invocations (lines 30-80)
  - Add MongoDB client initialization
  - Pass MongoDB client to extract layer

- [MODIFY] **MODIFY:** `/home/hestergong/Downloads/coi-mvp-etl/package.json`
  - Add TypeScript dependencies
  - Add MongoDB driver
  - Add build scripts

---

## Acceptance Criteria

### Part A: Set Up TypeScript

- [ ] **Create `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Update `package.json`:**
```json
{
  "name": "coi-mvp-etl",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "tsc && node dist/index.js",
    "watch": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "date-fns": "^3.6.0",
    "date-fns-tz": "^3.2.0",
    "handlebars": "^4.7.8",
    "lodash.get": "^4.4.2",
    "node-fetch": "^3.3.2",
    "pdf-lib": "^1.17.1",
    "mongodb": "^6.3.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "@types/lodash.get": "^4.4.9",
    "typescript": "^5.3.0"
  }
}
```

- [ ] **Run:** `yarn install`

---

### Part B: Port Core Helper Functions from Old System

#### B1. Create Type Definitions

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/data/types/PolicyView.ts`

```typescript
import { ObjectId } from 'mongodb';

export interface ApplicationAnswers {
  version: number;
  data: {
    answers: {
      BusinessInformation_100_CompanyName_WORLD_EN: string;
      BusinessInformation_100_DBAName_WORLD_EN?: string;
      BusinessInformation_100_MailingAddress_WORLD_EN?: Address;  // Canada
      BusinessInformation_100_BusinessAddress_WORLD_EN?: Address; // US
      BusinessInformation_100_Profession_WORLD_EN?: string | string[]; // Canada
      professionLabelList?: string[]; // US
    };
    applicationId: string;
    timeZone: string;
  };
}

export interface Address {
  street: string;
  city: string;
  province: string;
  postalCode: string;
}

export interface PolicyObject {
  _id: ObjectId;
  version: number;
  data: {
    kind: string;
    coverage: {
      effectiveDate: Date;
      expiryDate: Date;
    };
    carrierPartner?: string;
    policies: Policy[];
    application: {
      _id: ObjectId;
    };
  };
}

export interface Policy {
  kind: string;
  policyId: string;
}

export interface QuoteObject {
  _id: ObjectId;
  version: number;
  data: {
    kind: string;
    rating: {
      kind: 'US' | 'Canada';
      input: UsCommonRatingInput | CanadaRatingInput;
    };
  };
}

export interface UsCommonRatingInput {
  GL: {
    policyEffectiveDate: Date;
    policyExpirationDate: Date;
    occurrenceLimit: number;
    premisesRentedToYouLimit: number;
    medicalPaymentsLimit: number;
    aggregateLimit: number;
  };
}

export interface CanadaRatingInput {
  GL: {
    aggregateLimit: string | number;
    deductible: string | number;
    occurrenceLimit: string | number;
    medicalPaymentsLimit: string | number;
    tenantLegalLiabilityLimit: string | number;
    limitedPollutionLiability: boolean;
    limitedPollutionLiabilityOccurrenceLimit?: string | number;
    limitedCoverageForUnmannedAircraft: boolean;
    limitedCoverageForUnmannedAircraftLimit?: string | number;
    miscellaneousEO: boolean;
    miscellaneousEODeductible?: string | number;
    miscellaneousEOOccurrenceLimit?: string | number;
    miscellaneousEOAggregateLimit?: string | number;
  };
}

export interface ApplicationOwnerObject {
  data: {
    authenticatedEmail: string;
  };
}

export interface ApplicationDocument {
  _id: ObjectId;
}

export interface PolicyView {
  application: ApplicationDocument;
  applicationAnswers: ApplicationAnswers;
  applicationOwner: ApplicationOwnerObject;
  quote: QuoteObject;
  policy: PolicyObject;
}
```

**Source:** Derived from [foxden-policy-document-backend/src/services/utils/findPolicyHead.ts](foxden-policy-document-backend/src/services/utils/findPolicyHead.ts)

#### B2. Port `generateNamedInsured`

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/data/utils/generateNamedInsured.ts`

```typescript
/**
 * Ported from: foxden-policy-document-backend/src/utils/generateNamedInsured.ts
 * Generates insured name with optional DBA.
 */
export function generateNamedInsured(
  companyName: unknown,
  dbaName: unknown,
): string {
  if (typeof companyName !== 'string') {
    throw Error('Invalid company name');
  }
  let dba = undefined;
  if (typeof dbaName == 'string' && dbaName.trim().length > 0) {
    dba = dbaName;
  }
  const insuredName = dba ? `${companyName} DBA ${dba}` : companyName;
  return insuredName;
}
```

**Source:** Copy from [foxden-policy-document-backend/src/utils/generateNamedInsured.ts](foxden-policy-document-backend/src/utils/generateNamedInsured.ts) - **EXACT COPY**

#### B3. Port `getPolicyIdByLineOfBusiness`

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/data/utils/getPolicyIdByLineOfBusiness.ts`

```typescript
import { Policy } from '../types/PolicyView.js';

/**
 * Ported from: foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts
 * Retrieves the policy ID for a specific line of business from a list of policies.
 */
export function getPolicyIdByLineOfBusiness(
  policies: Policy[],
  lineOfBusiness: string,
): string {
  return policies.filter(
    (lineOfBusinessSpecificPolicy) =>
      lineOfBusinessSpecificPolicy.kind === lineOfBusiness,
  )[0]?.policyId;
}
```

**Source:** Copy from [foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts](foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts) - **EXACT COPY**

#### B4. Port `findPolicyHead` (MongoDB Aggregation)

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/data/services/PolicyDataExtractor.ts`

```typescript
import { Db } from 'mongodb';
import { PolicyView } from '../types/PolicyView.js';

/**
 * Ported from: foxden-policy-document-backend/src/services/utils/findPolicyHead.ts
 * Maps the active policy from a policyFoxdenId using MongoDB aggregation.
 */
export class PolicyDataExtractor {
  constructor(private db: Db) {}

  async findPolicyHead(policyFoxdenId: string): Promise<PolicyView | undefined> {
    // COPY EXACT MONGODB AGGREGATION FROM findPolicyHead.ts lines 33-141
    const pipeline: any[] = [
      {
        $match: {
          'data.policyFoxdenId': policyFoxdenId,
        },
      },
      {
        $project: {
          activePolicy: '$$ROOT',
        },
      },
      {
        $lookup: {
          from: 'Policy',
          localField: 'activePolicy.data.policyObjectId',
          foreignField: '_id',
          as: 'policy',
        },
      },
      {
        $unwind: {
          path: '$policy',
        },
      },
      {
        $lookup: {
          from: 'ApplicationAnswers',
          localField: 'policy._id',
          foreignField: 'data.endorsementPolicyObjectId',
          as: 'applicationAnswers',
        },
      },
      {
        $unwind: {
          path: '$applicationAnswers',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'PolicyQuote',
          localField: 'policy._id',
          foreignField: 'data.policyObjectId',
          as: 'policyQuote',
        },
      },
      {
        $unwind: {
          path: '$policyQuote',
        },
      },
      {
        $lookup: {
          from: 'Quote',
          localField: 'policyQuote.data.quoteObjectId',
          foreignField: '_id',
          as: 'quote',
        },
      },
      {
        $unwind: {
          path: '$quote',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          applicationAnswers: {
            $cond: {
              if: {
                $ne: ['$policy.data.kind', 'root'],
              },
              then: '$applicationAnswers',
              else: '$policy.data.applicationAnswers',
            },
          },
          quote: 1,
          policy: 1,
        },
      },
      {
        $lookup: {
          from: 'ApplicationOwner',
          localField: 'applicationAnswers.data.applicationId',
          foreignField: 'data.applicationId',
          as: 'applicationOwner',
        },
      },
      {
        $unwind: {
          path: '$applicationOwner',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: 'Application',
          localField: 'applicationAnswers.data.applicationId',
          foreignField: '_id',
          as: 'application',
        },
      },
      {
        $unwind: {
          path: '$application',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const cursor = this.db.collection('ActivePolicy').aggregate<PolicyView>(pipeline);

    try {
      const ret = await cursor.next();
      if (!ret) {
        return undefined;
      }

      if (await cursor.next()) {
        throw new Error('Unreachable due to index - inconsistent database');
      }

      const {
        applicationAnswers: { version: applicationAnswersVersion },
        policy: { version: policyVersion },
        quote: { version: quoteVersion },
      } = ret;

      if (applicationAnswersVersion !== 7) {
        throw new Error(`Error: Application Data version changed (expected 7, got ${applicationAnswersVersion})`);
      }

      if (policyVersion !== 6) {
        throw new Error(`Error: Policy data version changed (expected 6, got ${policyVersion})`);
      }

      if (quoteVersion !== 9) {
        throw new Error(`Error: Quote data version changed (expected 9, got ${quoteVersion})`);
      }

      return ret;
    } finally {
      await cursor.close();
    }
  }
}
```

**Source:** Copy MongoDB aggregation from [foxden-policy-document-backend/src/services/utils/findPolicyHead.ts](foxden-policy-document-backend/src/services/utils/findPolicyHead.ts) - **EXACT COPY**

---

### Part D: Create MongoDB Client Wrapper

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/data/client/MongoDbClient.ts`

```typescript
import { MongoClient, Db } from 'mongodb';

export class MongoDbClient {
  private client: MongoClient | null = null;
  private db: Db | null = null;

  constructor(private uri: string) {}

  async connect(): Promise<void> {
    if (!this.client) {
      this.client = new MongoClient(this.uri);
      await this.client.connect();
      this.db = this.client.db();
    }
  }

  async close(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  getDb(): Db {
    if (!this.db) {
      throw new Error('MongoDB client not connected. Call connect() first.');
    }
    return this.db;
  }

  getClient(): MongoClient {
    if (!this.client) {
      throw new Error('MongoDB client not connected. Call connect() first.');
    }
    return this.client;
  }
}
```

---

### Part E: Update Extract Layer

#### E1. DELETE Fixtures

```bash
rm /home/hestergong/Downloads/coi-mvp-etl/src/fixtures.mjs
rm /home/hestergong/Downloads/coi-mvp-etl/src/generator/extract/fixtures.mjs  # if exists
```

#### E2. Replace `extract.mjs` with `extract.ts`

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/extract/extract.ts`

```typescript
import { Db } from 'mongodb';
import { PolicyDataExtractor } from '../../data/services/PolicyDataExtractor.js';
import { getPolicyIdByLineOfBusiness } from '../../data/utils/getPolicyIdByLineOfBusiness.js';
import { CanadaRatingInput, UsCommonRatingInput, Address } from '../../data/types/PolicyView.js';

interface ExtractParams {
  policyFoxdenId: string;
  lob: string;
  geography: 'US' | 'CA';
  additionalInsured: {
    name: string;
    address: Address;
  };
}

/**
 * PRODUCTION EXTRACT step - fetches real data from MongoDB.
 * Replaces fixture-based extraction.
 */
export async function extract(db: Db, params: ExtractParams) {
  const policyExtractor = new PolicyDataExtractor(db);
  const policy = await policyExtractor.findPolicyHead(params.policyFoxdenId);

  if (!policy) {
    throw new Error(`Policy not found: ${params.policyFoxdenId}`);
  }

  // Route to geography-specific extraction
  if (params.geography === 'CA') {
    return extractCanadaData(policy, params);
  } else if (params.geography === 'US') {
    return extractUSData(db, policy, params);
  } else {
    throw new Error(`Unsupported geography: ${params.geography}`);
  }
}

/**
 * Ported from: sendCertificateOfInsurance.ts:36-108
 * Extracts Canada COI data from policy.
 */
function extractCanadaData(policy: any, params: ExtractParams) {
  // COPY EXACT EXTRACTION LOGIC FROM sendCertificateOfInsurance.ts lines 36-108
  const {
    applicationAnswers: {
      data: {
        answers: {
          BusinessInformation_100_CompanyName_WORLD_EN: businessName,
          BusinessInformation_100_DBAName_WORLD_EN: dbaName,
          BusinessInformation_100_MailingAddress_WORLD_EN: namedInsuredAddress,
          BusinessInformation_100_Profession_WORLD_EN: rawProfession,
        },
        timeZone,
      },
    },
    policy: {
      data: {
        coverage: { effectiveDate, expiryDate },
        carrierPartner,
      },
    },
    quote: { data: quoteData },
  } = policy;

  const professionList: string[] = Array.isArray(rawProfession)
    ? rawProfession
    : [rawProfession];

  const recipientEmail = policy.applicationOwner.data.authenticatedEmail;
  const ratingInput = quoteData.rating.input as CanadaRatingInput;

  return {
    policyFoxdenId: params.policyFoxdenId,
    geography: 'CA' as const,
    lob: params.lob,
    businessName,
    dbaName,
    namedInsuredAddress,
    professionList,
    timeZone,
    effectiveDate,
    expiryDate,
    carrierPartner,
    recipientEmail,
    additionalInsured: params.additionalInsured,
    ratingInput,
  };
}

/**
 * Ported from: sendUsCertificateOfInsurance.ts:38-98
 * Extracts US COI data from policy.
 */
async function extractUSData(db: Db, policy: any, params: ExtractParams) {
  // COPY EXACT EXTRACTION LOGIC FROM sendUsCertificateOfInsurance.ts lines 38-98
  const {
    applicationAnswers: {
      data: {
        answers: {
          BusinessInformation_100_CompanyName_WORLD_EN: businessName,
          BusinessInformation_100_DBAName_WORLD_EN: dbaName,
          professionLabelList: professionList,
          BusinessInformation_100_BusinessAddress_WORLD_EN: businessAddress,
        },
        timeZone,
      },
    },
    quote: { data: quoteData },
    policy: { data: policyData },
  } = policy;

  const recipientEmail = policy.applicationOwner.data.authenticatedEmail;
  const ratingInput = quoteData.rating.input as UsCommonRatingInput;

  // Get policy number for this LOB
  const policyNumber = getPolicyIdByLineOfBusiness(policyData.policies, params.lob);

  // Certificate numbering remains in old system for now (deferred)

  return {
    policyFoxdenId: params.policyFoxdenId,
    geography: 'US' as const,
    lob: params.lob,
    businessName,
    dbaName,
    businessAddress,
    professionList,
    timeZone,
    carrierPartner: policyData.carrierPartner,
    recipientEmail,
    additionalInsured: params.additionalInsured,
    policyNumber,
    ratingInput,
  };
}
```

**Source:** Combines logic from:
- [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts) - Canada
- [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts) - US

#### E3. Update `index.mjs` → `index.ts`

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/index.ts`

```typescript
import { config } from 'dotenv';
config(); // Load .env

import { MongoDbClient } from './data/client/MongoDbClient.js';
import { generateCOI } from './generator/generateCOI.js';  // Will need to convert this too
import fs from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = path.resolve('./out');

export async function handler(evt: any) {
  // Initialize MongoDB connection
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI environment variable is required');
  }

  const mongoClient = new MongoDbClient(mongoUri);
  await mongoClient.connect();

  try {
    await fs.mkdir(OUT_DIR, { recursive: true });

    for (const lob of evt.lobs) {
      const { pdfBytes } = await generateCOI({
        db: mongoClient.getDb(),  // Pass MongoDB connection
        applicationId: evt.applicationId,
        policyFoxdenId: evt.policyFoxdenId,
        lob,
        geography: evt.geography,
        carrierPartner: evt.carrierPartner,
        timeZone: evt.timeZone,
        additionalInsured: evt.additionalInsured
      });

      const outPath = path.join(OUT_DIR, `COI_${evt.applicationId}_${lob}.pdf`);
      await fs.writeFile(outPath, pdfBytes);

      console.log(`[DONE] COI generated: ${outPath}`);
    }
  } finally {
    await mongoClient.close();
  }
}

// For local testing (optional - can be removed)
if (process.env.NODE_ENV !== 'production') {
  const testEvent = {
    applicationId: 'test-app-123',
    policyFoxdenId: process.env.TEST_POLICY_ID || 'POLICY-ROOT-123',
    geography: 'US',
    timeZone: 'America/New_York',
    carrierPartner: 'StateNational',
    lobs: ['GL'],
    additionalInsured: {
      name: 'Big Bank Ltd',
      address: {
        street: '1 Main St',
        city: 'New York',
        province: 'NY',
        postalCode: '10001'
      }
    }
  };

  handler(testEvent).catch(console.error);
}
```

---

### Part F: Environment Configuration

**File:** `/home/hestergong/Downloads/coi-mvp-etl/.env`

```bash
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/foxquilt

# For testing
TEST_POLICY_ID=POLICY-ROOT-123

# Node environment
NODE_ENV=development
```

---

### Part G: Update Pipeline to Pass DB

**File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/pipeline/runPipeline.mjs`

Change to `.ts` and update to accept `db` parameter and pass it to extract:

```typescript
export async function runPipeline(db, extractInput, config) {
  // Extract - pass db
  const extracted = await extract(db, extractInput);

  // Rest of pipeline...
  const canonical = transform(extracted, config);
  const mapped = mapData(canonical, config);
  const pdf = await loadPdf(mapped, config);

  return pdf;
}
```

---

## Summary of Changes

| Action | File | Description |
|--------|------|-------------|
| [REMOVE] DELETE | `src/fixtures.mjs` | Remove MVP fixture data |
| [REMOVE] DELETE | `src/generator/extract/fixtures.mjs` | Remove duplicate fixtures |
| [CREATE] CREATE | `tsconfig.json` | TypeScript configuration |
| [CREATE] CREATE | `src/data/client/MongoDbClient.ts` | MongoDB connection wrapper |
| [CREATE] CREATE | `src/data/types/PolicyView.ts` | TypeScript interfaces |
| [CREATE] CREATE | `src/data/utils/generateNamedInsured.ts` | Port from old system |
| [CREATE] CREATE | `src/data/utils/getPolicyIdByLineOfBusiness.ts` | Port from old system |
| [CREATE] CREATE | `src/data/services/PolicyDataExtractor.ts` | Port findPolicyHead |
| [MODIFY] REPLACE | `src/generator/extract/extract.mjs` → `extract.ts` | Real MongoDB extraction |
| [MODIFY] REPLACE | `src/index.mjs` → `index.ts` | Add MongoDB initialization |
| [MODIFY] MODIFY | `package.json` | Add TypeScript + MongoDB deps |
| [MODIFY] MODIFY | `.env` | Add MONGODB_URI |

---

## Integration Flow

```
1. src/index.ts
   └─> Creates MongoDbClient
   └─> Calls generateCOI({ db, ... })

2. src/generator/generateCOI.ts
   └─> Calls runPipeline(db, ...)

3. src/generator/pipeline/runPipeline.ts
   └─> Calls extract(db, ...)

4. src/generator/extract/extract.ts
   ├─> Creates PolicyDataExtractor(db)
   ├─> Calls findPolicyHead(policyFoxdenId)
   ├─> Routes to extractCanadaData() or extractUSData()
   └─> Returns extracted data

5. Extract data flows to transform → map → load
```

---

## Testing

```bash
# 1. Install dependencies
yarn install

# 2. Build TypeScript
yarn build

# 3. Set up test MongoDB with real data
# (Copy data from production or use test fixtures)

# 4. Run
yarn start

# Should generate COI using real MongoDB data
```

---

This is the complete Story 1 with **specific file locations**, **TypeScript**, and **clear integration points**.

---

## Additional Notes (Alignment with Old System)

- Port and use `isAddressType` (runtime guard) in `src/data/utils/address/isAddressType.ts` and enforce it in `extractCanadaData()` and `extractUSData()`.
- Gate extraction by geography and quote type:
  - Canada: `quoteData.rating.kind === 'Canada'`, only `QuoteKind.Original` supported.
  - US: `quoteData.rating.kind !== 'Canada'`, only `QuoteKind.Original` supported; `policyData.kind` must be `Root` when deriving `policyNumber`.
- Capture `recipientEmail`, `timeZone`, and apply `carrierPartner || defaultCarrierPartner` fallback when building inputs.
