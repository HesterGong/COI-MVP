# Story 0: TypeScript Setup & Project Structure

**Story ID:** COI-0 | **Priority:** High | **Story Points:** 8 | **Phase:** Preparation

---

## 📚 Quick Links

- **Track Progress:** [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#story-0-setup) - Check off items as you complete
- **Quick Reference:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) - For daily coding
- **Old System Code:** `~/Desktop/repos/foxden-policy-document-backend/`

---

## 🎯 Objective

Set up TypeScript infrastructure and create clean project structure for Stories 1-4.

**Time Estimate:** 2 hours

---

## ⚡ Quick Start (Copy-Paste Commands)

### 1. Install Dependencies (5 min)

```bash
cd /home/hestergong/Downloads/coi-mvp-etl

# TypeScript & tooling
yarn add typescript ts-node @types/node
yarn add -D jest ts-jest @types/jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier

# Core dependencies
yarn add dotenv mongodb @aws-sdk/client-s3 pdf-lib handlebars date-fns lodash
yarn add -D @types/mongodb @types/lodash @types/handlebars
```

### 2. Create Folders (2 min)

```bash
# Data layer (Story 1)
mkdir -p src/data/{client,services,utils/address}

# ETL Pipeline
mkdir -p src/generator/{pipeline,extract,transform,map,load/{acord25,canada}}

# Config & Delivery
mkdir -p src/{config/forms,delivery/templates}

# Templates & Tests
mkdir -p templates/{acord25,html,signatures} test/{unit,integration,fixtures}
```

### 3. Copy Assets (5 min)

```bash
OLD=~/Desktop/repos/foxden-policy-document-backend
NEW=/home/hestergong/Downloads/coi-mvp-etl

# Form configs
cp $OLD/src/services/UScertificateOfInsurance/configs/UScoiFormsConfigs-{StateNational,Munich}.json \
   $NEW/src/config/forms/

# Signatures
cp $OLD/src/services/USpolicydocument/{stateNational/StateNationalPresidentSignature,munich/MunichUSSignature}.png \
   $NEW/templates/signatures/

# Templates
cp $OLD/src/services/UScertificateOfInsurance/assets/acord_25_2016-03.pdf $NEW/templates/acord25/
cp $OLD/src/services/certificateOfInsurance/template/template.handlebars $NEW/templates/html/
cp $OLD/src/services/certificateOfInsurance/template/emailBody.html $NEW/src/delivery/templates/coi-email-en.html
```

---

## 📝 Configuration Files

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "Node",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

### jest.config.ts
```typescript
import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  roots: ['<rootDir>/src', '<rootDir>/test'],
  testMatch: ['**/?(*.)+(spec|test).ts']
};

export default config;
```

### .eslintrc.js
```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  env: { node: true, es2021: true }
};
```

### .prettierrc
```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "all",
  "printWidth": 100
}
```

### .env.example
```bash
MONGODB_URI=mongodb://localhost:27017/foxden
COI_S3_BUCKETNAME=foxquilt-coi-prod
BROWSERLESS_API_TOKEN=your-token-here
EMAIL_SENDER=noreply@foxquilt.com
SUPPORT_EMAIL=support@foxquilt.com
EMAIL_BCC3=analytics@foxquilt.com
EMAIL_TEST_MODE=false
```

### package.json scripts
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node --enable-source-maps dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "lint": "eslint 'src/**/*.ts'",
    "format": "prettier --write ."
  }
}
```

---

## 🔄 Convert .mjs → .ts (30 min)

**Files to convert:**
1. `src/index.mjs` → `src/index.ts`
2. `src/types.mjs` → `src/types.ts`
3. `src/generator/generateCOI.mjs` → `src/generator/generateCOI.ts`
4. `src/generator/pipeline/runPipeline.mjs` → `src/generator/pipeline/runPipeline.ts`
5. `src/generator/extract/extract.mjs` → `src/generator/extract/extract.ts`
6. `src/generator/transform/transform.mjs` → `src/generator/transform/transform.ts`
7. `src/generator/map/map.mjs` → `src/generator/map/map.ts`
8. `src/generator/load/loadPdf.mjs` → `src/generator/load/loadPdf.ts`
9. `src/generator/load/canada/htmlGenerator.mjs` → `src/generator/load/canada/htmlGenerator.ts`
10. `src/generator/load/html/helpers.mjs` → `src/generator/load/canada/helpers.ts` **(move!)**

**Per file:**
1. Rename `.mjs` → `.ts`
2. Add type annotations
3. Remove `.mjs` from imports
4. Run `yarn typecheck` and fix errors

---

## 🔨 Create Stub Files (20 min)

These will be implemented in Story 1. Create with error stubs:

**src/data/client/MongoDbClient.ts:**
```typescript
export class MongoDbClient {
  async connect(uri: string): Promise<void> {
    throw new Error('Story 1: Not implemented');
  }
  getDb(): any {
    throw new Error('Story 1: Not implemented');
  }
}
```

**src/data/services/PolicyDataExtractor.ts:**
```typescript
export async function findPolicyHead(params: any, context: any): Promise<any> {
  throw new Error('Story 1: Port from findPolicyHead.ts (195 lines)');
}
```

**src/data/utils/generateNamedInsured.ts:**
```typescript
export function generateNamedInsured(companyName: unknown, dbaName: unknown): string {
  throw new Error('Story 1: Port from generateNamedInsured.ts (16 lines)');
}
```

**src/data/utils/address/isAddressType.ts:**
```typescript
export function isAddressType(val: unknown): boolean {
  throw new Error('Story 1: Port from isAddressType.ts (21 lines)');
}
```

**src/data/utils/getPolicyIdByLineOfBusiness.ts:**
```typescript
export function getPolicyIdByLineOfBusiness(policies: any[], lob: string): string {
  throw new Error('Story 1: Port from getPolicyIdByLineOfBusiness.ts (19 lines)');
}
```

**src/data/utils/getLatestActivePolicy.ts:**
```typescript
export async function getLatestActivePolicy(params: any): Promise<any> {
  throw new Error('Story 1: Port from getLatestPolicy.ts (44 lines)');
}
```

**src/data/utils/saveInsuranceDocumentUtils.ts:**
```typescript
export async function getCarrierFromPolicy(policy: any, logger: any): Promise<string> {
  throw new Error('Story 1: Port from saveInsuranceDocumentUtils.ts (35 lines)');
}
```

**src/data/services/ProfessionLookupService.ts:**
```typescript
export async function getProfessionNameList(professions: string[]): Promise<string[]> {
  throw new Error('Story 3: Port from getProfessionNameList.ts (13 lines)');
}
```

---

## ⚙️ Configuration System (15 min)

**src/config/types.ts:**
```typescript
export interface COIConfig {
  geography: {
    canada: { dateFormat: string; currency: string; insuranceCompany: string };
    us: { dateFormat: string; currency: string };
  };
  carriers: Record<string, CarrierInfo>;
}

export interface CarrierInfo {
  name: string;
  displayName: string;
  signaturePath?: string;
  formsConfigPath?: string;
  supportedGeographies: string[];
  supportedLOBs: string[];
}
```

**src/config/carriers.ts:**
```typescript
export const carriers = {
  StateNational: {
    name: 'StateNational',
    displayName: 'State National Insurance Company',
    signaturePath: 'templates/signatures/StateNationalPresidentSignature.png',
    formsConfigPath: 'src/config/forms/UScoiFormsConfigs-StateNational.json',
    supportedGeographies: ['US'],
    supportedLOBs: ['GL', 'EO'],
  },
  Munich: {
    name: 'Munich',
    displayName: 'Munich Re',
    signaturePath: 'templates/signatures/MunichUSSignature.png',
    formsConfigPath: 'src/config/forms/UScoiFormsConfigs-Munich.json',
    supportedGeographies: ['US'],
    supportedLOBs: ['GL', 'EO'],
  },
};
```

**src/config/index.ts:**
```typescript
import { carriers } from './carriers';

export const COI_CONFIG = {
  geography: {
    canada: {
      dateFormat: 'yyyy/MM/dd',
      currency: 'CAD',
      insuranceCompany: "Certain Underwriters at Lloyd's of London",
    },
    us: {
      dateFormat: 'MM-dd-yyyy',
      currency: 'USD',
    },
  },
  carriers,
};

export * from './types';
```

---

## ✅ Verification (5 min)

```bash
# All should pass:
yarn typecheck    # No TypeScript errors
yarn lint         # No critical errors
yarn build        # Creates dist/ folder
yarn test         # Runs (may be 0 tests)
```

---

## 📋 Acceptance Criteria

Check these off in [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#story-0-setup):

- [ ] Dependencies installed
- [ ] Config files created (6 files)
- [ ] Folders created
- [ ] Assets copied (7 files)
- [ ] .mjs files converted (10 files)
- [ ] Stub files created (8 files)
- [ ] Configuration system created (3 files)
- [ ] `yarn build` succeeds
- [ ] `yarn typecheck` passes

---

## 🚀 Next Steps

After Story 0 is complete, Story 1 will:
1. Replace all 8 stub functions with real code from old system
2. Extract 18 data fields from MongoDB
3. Connect to real database

See [story1-implementation.md](./story1-implementation.md) for details.

---

## 🆘 Troubleshooting

**TypeScript errors:** Check import paths, add missing `@types/*` packages
**Build fails:** Run `yarn typecheck` to see specific errors
**Assets not found:** Verify old system path exists

---

**Estimated Time:** 2 hours
