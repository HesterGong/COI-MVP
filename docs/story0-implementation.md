# Story 0: Project Preparation & TypeScript Setup – Implementation Guide

**Story ID:** COI-0
**Priority:** High
**Story Points:** 8
**Phase:** 0 - Preparation
**Epic:** COI-2024

## Objective

Refactor the current codebase to a clean, TypeScript-based structure that supports all later stories without breaking existing behavior. Establish tooling, environment configuration, and a stable folder layout. Keep generation working during the transition.

Note: For MVP planning, this guide is documentation-only. No code changes are required in this step per current request. Stories 0–3 collectively define the MVP scope; implementation will follow once approved.

## Outcomes

- TypeScript enabled with strict mode
- Final project folder structure created
- Core files moved from `.mjs` to `.ts`
- ESLint, Prettier, Jest (ts-jest) in place
## Outcomes

- TypeScript enabled with strict mode
- Final project folder structure created
- Core files moved from `.mjs` to `.ts`
- ESLint, Prettier, Jest (ts-jest) in place
- `package.json` scripts updated
- `.env.example` created; environment variables documented
- Temporary adapters used where needed to avoid breaking changes

## Final Project Structure (target)

```
coi-mvp-etl/
	.env.example
	package.json
	tsconfig.json
	jest.config.ts
	README.md
	docs/
		AI_AGENT_INSTRUCTIONS.md
		story0.md                # Story 0 overview
		story0-implementation.md # This guide
		story1-implementation.md
		story2-implementation.md
		story3-implementation.md
	src/
		index.ts
		types.ts
		config/
			index.ts
			types.ts
			carriers.ts
			forms/
				UScoiFormsConfigs-StateNational.json
				UScoiFormsConfigs-Munich.json
			mappings.ts
		data/
			client/
				MongoDbClient.ts              # Story 1
			services/
				PolicyDataExtractor.ts        # Story 1 (findPolicyHead)
				CarrierInfoService.ts         # Story 1
				CertificateNumberService.ts   # Story 1 (bug fix)
				ProfessionLookupService.ts    # Story 3
			utils/
				generateNamedInsured.ts       # Story 1
				address/
					isAddressType.ts            # Story 1
				getPolicyIdByLineOfBusiness.ts# Story 1
				getLatestActivePolicy.ts      # Story 1
				saveInsuranceDocumentUtils.ts # Story 1 (carrier helpers)
		generator/
			generateCOI.ts
			pipeline/
				runPipeline.ts
			extract/
				extract.ts
			transform/
				transform.ts
				types.ts
			map/
				map.ts
			load/
				loadPdf.ts
				acord25/
					pdfGenerator.ts
				canada/
					htmlGenerator.ts
					helpers.ts
				utils/
		templates/
			acord25/
			html/
				template.handlebars
			signatures/
```

## Implementation Steps

### 1) Install tooling (Yarn)

```
yarn add typescript ts-node
yarn add -D jest ts-jest @types/jest
yarn add -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier eslint-plugin-import prettier
yarn add dotenv mongodb pdf-lib handlebars
```

### 2) Add TypeScript config

Create [tsconfig.json](tsconfig.json):

```
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

### 3) Set up Jest

Create [jest.config.ts](jest.config.ts):

```
import type { Config } from 'jest';

const config: Config = {
	testEnvironment: 'node',
	preset: 'ts-jest',
	roots: ['<rootDir>/src', '<rootDir>/test'],
	testMatch: ['**/?(*.)+(spec|test).ts']
};

export default config;
```

### 4) ESLint + Prettier

Create [.eslintrc.js](.eslintrc.js):

```
module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: ['@typescript-eslint', 'import'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
	env: { node: true, es2021: true },
	parserOptions: { sourceType: 'module' }
};
```

Create [.prettierrc](.prettierrc):

```
{
	"singleQuote": true,
	"semi": true
}
```

### 5) Package scripts

Update [package.json](package.json) scripts:

```
{
	"scripts": {
		"build": "tsc",
		"start": "node --enable-source-maps dist/index.js",
		"dev": "ts-node src/index.ts",
		"test": "jest",
		"lint": "eslint 'src/**/*.ts'",
		"format": "prettier -w ."
	}
}
```

### 6) Environment variables

Add [ .env.example ](.env.example):

```
MONGODB_URI=mongodb://localhost:27017/foxden
EMAIL_SENDER=no-reply@example.com
EMAIL_TEST_MODE=true
BROWSERLESS_TOKEN=replace_me
```

### 7) File refactor map (mjs → ts)

- [src/index.mjs](src/index.mjs) → [src/index.ts](src/index.ts)
- [src/types.mjs](src/types.mjs) → [src/types.ts](src/types.ts)
- [src/generator/generateCOI.mjs](src/generator/generateCOI.mjs) → [src/generator/generateCOI.ts](src/generator/generateCOI.ts)
- [src/generator/pipeline/runPipeline.mjs](src/generator/pipeline/runPipeline.mjs) → [src/generator/pipeline/runPipeline.ts](src/generator/pipeline/runPipeline.ts)
- [src/generator/extract/extract.mjs](src/generator/extract/extract.mjs) → [src/generator/extract/extract.ts](src/generator/extract/extract.ts)
- [src/generator/transform/transform.mjs](src/generator/transform/transform.mjs) → [src/generator/transform/transform.ts](src/generator/transform/transform.ts)
- [src/generator/map/map.mjs](src/generator/map/map.mjs) → [src/generator/map/map.ts](src/generator/map/map.ts)
- [src/generator/load/loadPdf.mjs](src/generator/load/loadPdf.mjs) → [src/generator/load/loadPdf.ts](src/generator/load/loadPdf.ts)
- [src/generator/load/canada/htmlGenerator.mjs](src/generator/load/canada/htmlGenerator.mjs) → [src/generator/load/canada/htmlGenerator.ts](src/generator/load/canada/htmlGenerator.ts)
- [src/generator/load/html/helpers.mjs](src/generator/load/html/helpers.mjs) → [src/generator/load/canada/helpers.ts](src/generator/load/canada/helpers.ts)

Transitional adapters are acceptable during migration (re-export functions) to avoid breaking runtime while renames land.

### 8) Create scaffolding for future stories

Add empty/stub files (to be implemented in Stories 1–3):

- [src/data/client/MongoDbClient.ts](src/data/client/MongoDbClient.ts)
- [src/data/services/PolicyDataExtractor.ts](src/data/services/PolicyDataExtractor.ts)
- [src/data/services/CarrierInfoService.ts](src/data/services/CarrierInfoService.ts)
- [src/data/services/CertificateNumberService.ts](src/data/services/CertificateNumberService.ts)
- [src/data/utils/generateNamedInsured.ts](src/data/utils/generateNamedInsured.ts)
- [src/data/utils/address/isAddressType.ts](src/data/utils/address/isAddressType.ts)
- [src/data/utils/getPolicyIdByLineOfBusiness.ts](src/data/utils/getPolicyIdByLineOfBusiness.ts)
- [src/data/utils/getLatestActivePolicy.ts](src/data/utils/getLatestActivePolicy.ts)
- [src/data/utils/saveInsuranceDocumentUtils.ts](src/data/utils/saveInsuranceDocumentUtils.ts)

These stubs should export the correct function names with `throw new Error('Not implemented in Story 0');` to ensure callers fail fast if accidentally invoked.

### 9) Config consolidation

- Create [src/config/index.ts](src/config/index.ts) that loads a typed `COI_CONFIG` and exposes geography, carrier, forms, and formatting defaults.
- Move US ACORD JSON into [src/config/forms/](src/config/forms/) and expose via config.
- Create [src/config/types.ts](src/config/types.ts) and [src/config/carriers.ts](src/config/carriers.ts).
- Keep Canada defaults (currency `CAD`, date `yyyy/MM/dd`) driven by config.

### 10) Keep generation working

- Maintain current behavior by providing minimal adapters where necessary (e.g., import paths) while TypeScript migration is staged.
- Run tests and a manual generation to confirm no regressions.

## Dependent Functions & Where They Will Live

Old system references (do not modify):

- Canada COI entry: [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
- US COI entry: [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
- Helpers to port:
	- [foxden-policy-document-backend/src/services/utils/findPolicyHead.ts](foxden-policy-document-backend/src/services/utils/findPolicyHead.ts) → [src/data/services/PolicyDataExtractor.ts](src/data/services/PolicyDataExtractor.ts)
	- [foxden-policy-document-backend/src/utils/generateNamedInsured.ts](foxden-policy-document-backend/src/utils/generateNamedInsured.ts) → [src/data/utils/generateNamedInsured.ts](src/data/utils/generateNamedInsured.ts)
	- [foxden-policy-document-backend/src/utils/address/isAddressType.ts](foxden-policy-document-backend/src/utils/address/isAddressType.ts) → [src/data/utils/address/isAddressType.ts](src/data/utils/address/isAddressType.ts)
	- [foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts](foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts) → [src/data/utils/getPolicyIdByLineOfBusiness.ts](src/data/utils/getPolicyIdByLineOfBusiness.ts)
	- [foxden-policy-document-backend/src/services/utils/getLatestPolicy.ts](foxden-policy-document-backend/src/services/utils/getLatestPolicy.ts) → [src/data/utils/getLatestActivePolicy.ts](src/data/utils/getLatestActivePolicy.ts)
	- [foxden-policy-document-backend/src/services/utils/saveInsuranceDocumentUtils.ts](foxden-policy-document-backend/src/services/utils/saveInsuranceDocumentUtils.ts) → [src/data/utils/saveInsuranceDocumentUtils.ts](src/data/utils/saveInsuranceDocumentUtils.ts)
	- [foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts) → [src/data/services/ProfessionLookupService.ts](src/data/services/ProfessionLookupService.ts)
	- [foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionMapper.ts](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionMapper.ts) → [src/data/services/ProfessionLookupService.ts](src/data/services/ProfessionLookupService.ts)

## Verification

After scaffolding:

```
yarn build
yarn test
yarn dev
```

Confirm the demo handler still runs and generates sample outputs. Address any TypeScript compilation issues before proceeding to Story 1.

## Notes

- Use Yarn for all package operations.
- Keep business logic unmodified during Story 0; only structure and tooling change.
- Canada HTML helpers should be moved to [src/generator/load/canada/helpers.ts](src/generator/load/canada/helpers.ts) to align with later stories.
