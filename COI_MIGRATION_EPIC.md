# EPIC: Build Production-Ready COI Generation Service (COI-MVP)

## [AI Agents] For AI Agents

**[Guide] START HERE:** [docs/AI_AGENT_INSTRUCTIONS.md](./docs/AI_AGENT_INSTRUCTIONS.md)

This document contains:
- How to approach each story
- Where to find old system code to port
- Guidelines for creating implementation guides
- Specific instructions for Story 2 onwards

**Note:** Stories in this epic are concise (for Jira). Detailed implementation guides are in `docs/story{N}-implementation.md`.

---

## Epic Overview

**Epic ID:** COI-2024
**Priority:** High
**Total Story Points:** 93

### Description

Build a production-ready, standalone COI generation service based on [COI-MVP](https://github.com/HesterGong/COI-MVP) that replicates all functionality from [foxden-policy-document-backend](https://github.com/Foxquilt/foxden-policy-document-backend) COI generation. The new service will be general, config-driven, and ready for future business expansion.

**IMPORTANT:** No changes to foxden-policy-document-backend - this is a clean, standalone replacement.

### Implementation Strategy

**REUSE PROVEN CODE:** This epic emphasizes porting existing, production-tested code from the old system rather than rewriting from scratch. Key functions like `findPolicyHead`, `generateNamedInsured`, `getPolicyIdByLineOfBusiness`, and data extraction logic will be copied and adapted (TypeScript → JavaScript/ESM) to ensure feature parity and reduce implementation risk. Only fix known bugs (e.g., certificate number concurrency) during porting.

**CONFIG-DRIVEN BEHAVIOR:** Template selection, carrier-specific forms, and signature assets are controlled via configuration. US COI supports StateNational and Munich carriers through distinct ACORD 25 JSON form configs; Canada COI uses Handlebars HTML with insurance company and formatting sourced from config.

### Repository Context

- **Reference (Old System):** https://github.com/Foxquilt/foxden-policy-document-backend - **DO NOT MODIFY**
- **Target (New System):** https://github.com/HesterGong/COI-MVP - **Build standalone service**

### Old Function Mapping → New ETL Structure (Doc-only mapping)

- Old `findPolicyHead` → New `src/data/services/PolicyDataExtractor.ts` (Story 1)
- Old `generateNamedInsured` → New `src/data/utils/generateNamedInsured.ts` (Story 1)
- Old `isAddressType` → New `src/data/utils/address/isAddressType.ts` (Story 1)
- Old `getPolicyIdByLineOfBusiness` → New `src/data/utils/getPolicyIdByLineOfBusiness.ts` (Story 1)
- Old Canada `sendCertificateOfInsurance.ts` (data selection + coverage build) → Extract parts into `extract.ts` (Story 1) and `transform.ts` (Story 2); render via Canada HTML loader
- Old Canada `generate.ts` (helpers + email) → HTML helpers reused; delivery moves to Story 4 Email Service
- Old US `sendUsCertificateOfInsurance.ts` (data selection + limits + insured block) → Extract parts into `extract.ts` (Story 1) and `transform.ts` (Story 2); render via ACORD 25 loader
- Old US `generate.ts` (PDF fill + email + S3) → ACORD form-fill reused; delivery/S3 moves to Story 4 (post-MVP)

### What Already Exists in COI-MVP

- [DONE] ETL pipeline architecture (Extract → Transform → Map → Load)
- [DONE] US ACORD 25 PDF renderer (pdf-lib)
- [DONE] Canada HTML → PDF renderer (Browserless)
- [DONE] Config-driven LOB/geography/carrier selection
- [DONE] Canonical data model and field mappings
- [DONE] Fixture-based MVP data

### Success Criteria

- [DONE] Standalone service with API/event interface
- [DONE] Feature parity with old system
- [DONE] General/configurable for new LOBs, geographies, carriers
- [DONE] Fully tested and production-ready
- [DONE] Deployed and ready to receive traffic

### Covered Scenarios (MVP)
- US COI (GL, EO): StateNational and Munich carriers (ACORD 25)
- Canada COI (GL, optional EO, optional others): Lloyd's (configurable via config)

---

## Story 0: Project Preparation & TypeScript Setup

**Story ID:** COI-0
**Priority:** High
**Story Points:** 8
**Phase:** 0 - Preparation
**Epic:** COI-2024

### Description

Prepare the project baseline to support all subsequent stories. Convert to TypeScript and refactor the current code/layout into a clean, maintainable structure that aligns with the planned ETL, config, and future delivery/API work. Establish tooling (lint, test, build), environment management, and conventions so later stories plug in without churn.

### Scope
 - Convert `.mjs` files to `.ts` with strict TypeScript settings.
 - Establish final folder layout under `src/` for ETL (extract/transform/map/load), data layer, and config.
 - Add Jest (ts-jest), ESLint, and Prettier; update `package.json` scripts.
 - Add environment management with `.env.example` and required variables.
 - Move Canada HTML helpers to `src/generator/load/canada/helpers.ts`.
 - Stage US ACORD JSON forms under `src/config/forms/`.
 - Keep current generation working via transitional adapters during migration.
 - Document dependent functions mapping in [docs/story0-implementation.md](docs/story0-implementation.md).

### Final Project Structure (planned)
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
     story0-implementation.md # Detailed guide
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

### Acceptance Criteria
 - TypeScript set up with strict mode (`tsconfig.json`).
 - Project compiles and runs with `yarn build` and `yarn dev`.
 - Jest, ESLint, Prettier configured and runnable.
 - `.env.example` includes required vars (`MONGODB_URI`, `EMAIL_SENDER`, `EMAIL_TEST_MODE`, `BROWSERLESS_TOKEN`).
 - Folder structure matches planned layout.
 - Canada helpers relocated; US ACORD JSONs staged in `src/config/forms/`.
 - Documentation updated: [docs/story0-implementation.md](docs/story0-implementation.md).

### Technical Notes
 - Port, don't rewrite. Keep business logic unchanged in this story; focus on structure/tooling.
 - Use Yarn for package management (`yarn build`, `yarn dev`, `yarn test`).
 - Provide transitional adapters where necessary to avoid breaking runtime during file renames.
 - Create stubs for Story 1–3 files that export correct function names and throw `Not implemented in Story 0`.
 - Canada/US reference files (read-only):
   - Canada COI: [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
   - US COI: [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
 - See detailed steps in [docs/story0-implementation.md](docs/story0-implementation.md).

---

## Story 1: Data Layer & MongoDB Integration

**Story ID:** COI-1
**Priority:** High
**Story Points:** 8
**Phase:** 1 - Foundation
**Epic:** COI-2024

### Description

Port existing, proven MongoDB data extraction functions from foxden-policy-document-backend to coi-mvp-etl. Set up TypeScript, remove MVP fixture code, and integrate ported functions with the existing ETL pipeline.

**IMPORTANT:** This story focuses on **PORTING existing code**, not writing new code from scratch.

**[Guide] Implementation Guide:** [docs/story1-implementation.md](./docs/story1-implementation.md)

### Scope

**Remove:**
- [REMOVE] `src/fixtures.mjs` - MVP fixture data (entire file)
- [REMOVE] `src/generator/extract/fixtures.mjs` - Duplicate fixtures

**Create:**
- [CREATE] TypeScript setup (`tsconfig.json`, update `package.json`)
- [CREATE] `src/data/` - New data layer with ported functions
  - `client/MongoDbClient.ts` - MongoDB connection wrapper
  - `types/PolicyView.ts` - TypeScript interfaces
  - `utils/generateNamedInsured.ts` - Port from old system
  - `utils/getPolicyIdByLineOfBusiness.ts` - Port from old system
  - `services/PolicyDataExtractor.ts` - Port `findPolicyHead`
  - `services/CertificateNumberService.ts` - Fix concurrency bug
  - `services/ProfessionLookupService.ts` - Port profession lookup
  - `services/PolicyMetadataService.ts` - Port metadata helpers
  - `services/CarrierInfoService.ts` - Port carrier lookup

**Modify:**
- [MODIFY] `src/generator/extract/extract.mjs` → `extract.ts` - Replace fixtures with real MongoDB
- [MODIFY] `src/index.mjs` → `index.ts` - Add MongoDB initialization

**References to port (from old system):**
- Canada COI entry: [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
- US COI entry: [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)

### Acceptance Criteria

- [ ] **Setup TypeScript** - Add tsconfig.json, update package.json with TypeScript + MongoDB dependencies
- [ ] **Port core functions** from old system (workspace references below):
  - `findPolicyHead` → `PolicyDataExtractor.ts` (copy aggregation exactly) — source: [foxden-policy-document-backend/src/services/utils/findPolicyHead.ts](foxden-policy-document-backend/src/services/utils/findPolicyHead.ts)
  - `generateNamedInsured` → `generateNamedInsured.ts` — source: [foxden-policy-document-backend/src/utils/generateNamedInsured.ts](foxden-policy-document-backend/src/utils/generateNamedInsured.ts)
  - `getPolicyIdByLineOfBusiness` → `getPolicyIdByLineOfBusiness.ts` — source: [foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts](foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts)
  - `getLatestActivePolicy` → `PolicyMetadataService.ts` — source: [foxden-policy-document-backend/src/services/utils/getLatestPolicy.ts](foxden-policy-document-backend/src/services/utils/getLatestPolicy.ts)
  - `getCarrierFromPolicy` → `CarrierInfoService.ts` — source: [foxden-policy-document-backend/src/services/utils/saveInsuranceDocumentUtils.ts](foxden-policy-document-backend/src/services/utils/saveInsuranceDocumentUtils.ts)
  - `getProfessionNameList` → `ProfessionLookupService.ts` — source: [foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts)
  - `isAddressType` → `address/isAddressType.ts` — source: [foxden-policy-document-backend/src/utils/address/isAddressType.ts](foxden-policy-document-backend/src/utils/address/isAddressType.ts)
- [ ] **Create CertificateNumberService** - Fix concurrency bug in old system (atomic `findOneAndUpdate` instead of `countDocuments`)
- [ ] **Create MongoDbClient** - Connection wrapper with pooling and retry logic
- [ ] **Update extract layer** - Replace fixture logic with real MongoDB extraction:
  - `extractCanadaData()` — port the data selection/destructuring portions from [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
  - `extractUSData()` — port the data selection/destructuring portions from [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
  - Canada fields: use `BusinessInformation_100_MailingAddress_WORLD_EN` for address, `BusinessInformation_100_Profession_WORLD_EN` for profession (array or string → array)
  - US fields: use `BusinessInformation_100_BusinessAddress_WORLD_EN` for address, `professionLabelList` for profession
  - Apply runtime type guard `isAddressType()` to all addresses (Canada and US)
  - Enforce `QuoteKind.Original` only; gate by geography: Canada vs US rating kinds
  - Capture `recipientEmail` and `timeZone` from `applicationAnswers.data` for downstream delivery and formatting
  - Use `carrierPartner || defaultCarrierPartner` when building inputs (match old system fallback behavior)
  - Persist carrier metadata in canonical model so Canada HTML has `insuranceCompany` available (default Lloyd's via config)
- [ ] **Environment config** - Add `.env` with `MONGODB_URI`
- [ ] **Unit tests** - Test all ported functions
- [ ] **Integration tests** - Test full extraction flow with MongoDB

### Technical Notes

**Porting Approach:**
- Copy MongoDB aggregation from `findPolicyHead` **exactly as-is** (it's tested in production)
- Keep same data structures and field names (maintain compatibility)
- Only fix known bugs (certificate number concurrency)

**Data Flow:**
```
index.ts → MongoDbClient → extract.ts → PolicyDataExtractor.findPolicyHead() → extractCanadaData/extractUSData
```

**Certificate Number Bug Fix:**
- Old: `countDocuments()` (race condition in certificate numbering; see US implementation) — refer to [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
- New: Implement atomic counter via `findOneAndUpdate({ $inc })` in `CertificateNumberService`

**Geography & Quote Guardrails:**
- Only process `QuoteKind.Original` quotes; reject others (matches old system)
- For Canada, ensure `quoteData.rating.kind === 'Canada'`; for US, ensure `quoteData.rating.kind !== 'Canada'`
- For US, `policyData.kind` must be `Root` before deriving `policyNumber` via `getPolicyIdByLineOfBusiness(PolicyKind.GL)`

### Dependencies

- None (foundation ticket)

---

## Story 2: Transform Layer Enhancement

**Story ID:** COI-2
**Priority:** High
**Story Points:** 10
**Phase:** 2 - Core Business Logic
**Epic:** COI-2024

### Description

Port existing, proven transformation logic from foxden-policy-document-backend to coi-mvp-etl. Replace generic transform.mjs with geography-specific transformations that handle Canada GL/EO/optional coverages and US insured block formatting.

**IMPORTANT:** This story focuses on **PORTING existing code**, not writing new code from scratch. Copy transformation logic from old system with minimal changes.

**[Guide] Implementation Guide:** [docs/story2-implementation.md](./docs/story2-implementation.md)

### Scope

**Remove:**
- [REMOVE] `src/generator/transform/transform.mjs` - Generic MVP transformer (entire file)

**Create:**
- [CREATE] `src/generator/transform/transform.ts` - Production transformation with geography routing
- [CREATE] `src/generator/transform/types.ts` - TypeScript interfaces for canonical model
- [CREATE] `src/generator/load/canada/helpers.ts` - Handlebars helpers (formatCurrency, formatDate, toLongProvinceName)

**Modify:**
- [MODIFY] `src/generator/pipeline/runPipeline.mjs` → `runPipeline.ts` - Use new transform function
- [MODIFY] `src/generator/map/map.mjs` → `map.ts` - Handle new canonical structure
- [MODIFY] `src/generator/load/canada/htmlGenerator.mjs` → `htmlGenerator.ts` - Use new helpers

### Acceptance Criteria

- [ ] **Port Canada transformation logic** from [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts):
  - String-to-number conversion (Canada sends `"5000000"` as string)
  - Build structured GL coverage: 6 main coverages + optional pollution extension
  - Conditionally build EO coverage (if `miscellaneousEO` flag is true)
  - Build "others" array for optional coverages (unmanned aircraft)
  - Use `generateNamedInsured()` from Story 1
  - Include `insuranceCompany` (from config; default Lloyd's) and honor `carrierPartner || defaultCarrierPartner`
- [ ] **Port US transformation logic** from [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts):
  - Format insured block as multi-line string: `"Name\nStreet\nCity, State, Zip"`
  - Join profession list with commas
  - Extract flat limits structure from rating input
  - Use quote dates (policyEffectiveDate/policyExpirationDate), NOT policy dates
  - Derive `policyNumber` via `getPolicyIdByLineOfBusiness(PolicyKind.GL)` only when `policyData.kind` is `Root`
  - Carry `timeZone` and `recipientEmail` through canonical model for Delivery
  - Select forms config (StateNational vs Munich) via carrier in config; validate PDF fields exist
- [ ] **Port Canada HTML helpers** from [foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts):
  - `formatCurrency()` - CAD formatting
  - `formatDate()` - yyyy/MM/dd format
  - `toLongProvinceName()` - ON → Ontario
  - Note: COI-MVP already provides equivalent helpers in [coi-mvp-etl/src/generator/load/html/helpers.mjs](coi-mvp-etl/src/generator/load/html/helpers.mjs)
- [ ] **Create canonical model structure** with TypeScript interfaces:
  - Geography-agnostic base fields (namedInsured, dates, addresses)
  - Canada-specific: `canada.coverages` (gl, eo?, others)
  - US-specific: `us.insuredBlock`, `us.limits`, `us.certificateNumber`
- [ ] **Update pipeline integration** - Pass canonical model through map → load stages
- [ ] **Unit tests** - Test all transformation scenarios (Canada GL, Canada EO, US, optional coverages)
- [ ] **Regression tests** - Compare output with old system using production data

### Technical Notes

**Porting Approach:**
- Copy Canada GL/EO/others building logic **exactly as-is** (lines 90-203 - it's tested in production)
- Copy US insured block formatting **exactly as-is** (line 108 - one line)
- Only changes: TypeScript types, use extracted data from Story 1

**Data Flow:**
```
extract.ts → transform.ts (THIS STORY) → map.ts → loadPdf.ts
```

**Key Transformations:**
- **Canada:** String → Number conversion, nested coverage objects, conditional EO
- **US:** Multi-line insured block, flat limits, quote dates

### Dependencies

- **Depends on:** Story 1 (Data Layer)

---

## Story 3: Configuration Management

**Story ID:** COI-3
**Priority:** High
**Story Points:** 5
**Phase:** 3 - Configuration
**Epic:** COI-2024

### Description
Centralize configuration into strictly-typed TypeScript modules so new geographies, LOBs, and carriers can be added without code changes. Move existing hardcoded values into `src/config/` and validate at startup.

See implementation guide: [docs/story3-implementation.md](docs/story3-implementation.md)

### Scope

- Consolidate configuration under a single `src/config/` with minimal subfolders:
  - `src/config/index.ts` — central typed loader exporting `COI_CONFIG`
  - `src/config/forms/` — US ACORD 25 JSON form configs (copy from current `src/generator/config/form-configs/`), future geographies can add here
  - `src/config/carriers.ts` — carrier metadata (signature assets, display names, supported geographies/LOBs)
  - `src/config/mappings.ts` — mapping config for CA GL/EO and US GL; keep BOP example for extensibility
  - `src/config/types.ts` — TypeScript interfaces for the config shape
- Move profession name lookups to Data Layer (`src/data/services/ProfessionLookupService.ts`) instead of a config folder.
- Runtime validation can be minimal (TypeScript + basic runtime checks); defer heavy validation and hot-reload endpoints to post-MVP.
- Signature assets remain under `templates/signatures/`; config references file paths, and load layer uses safe fallbacks when assets are missing.

### Acceptance Criteria

- Config extensibility with fewer folders: add UK/AU/BOP/Lloyd's without code changes
- Strict TypeScript interfaces; basic runtime checks (heavy validation and hot-reload endpoints are post-MVP)
- US ACORD 25 forms load via `src/config/forms/`; carrier selection drives signature embedding
- Canada formats (`CAD`, `yyyy/MM/dd`) and province resolver configurable via `src/config`
- `MappingConfig` drives transformers (CA GL/EO, US GL); BOP example present
- Profession mapper available via Data Layer (`ProfessionLookupService`) for Transform/Map/Load
- Documentation present: [docs/story3-implementation.md](docs/story3-implementation.md)
 - US signature embedding driven by carrier config; assets in `templates/signatures/` with generic fallback; missing assets do not break generation (log and continue)
 - Provide config entries for US StateNational and Munich (GL, EO) with distinct `formsConfigPath` values
 - Ensure Canada HTML has `insuranceCompany` sourced from config (default: `Certain Underwriters at Lloyd's of London`), not hardcoded

### Dependencies

- **Depends on:** Story 2 (Transform Layer)

---
## Story 4: Email & Delivery Service

**Story ID:** COI-4
**Priority:** High
**Story Points:** 8
**Phase:** 4 - Delivery
**Epic:** COI-2024

### Description

Build standalone email delivery service for COI PDFs. Make it general and support multiple delivery channels for future expansion.

### What Already Exists

- [DONE] Console log placeholder in [src/index.mjs:26](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs#L26): `console.log('EMAIL SENT (log only): ${outPath}')`

### Acceptance Criteria

- [ ] Create `src/delivery/` directory structure
- [ ] Create `EmailService`:
  - Use `createTransport` from `@foxden/shared-lib`
  - Configure email settings:
    - from: `EMAIL_SENDER` (environment variable)
    - to: recipient email (from policy data)
    - bcc: `SUPPORT_EMAIL`, `EMAIL_BCC3` (environment variables)
    - subject: "Foxquilt Insurance - Certificate of Insurance"
    - attachment: PDF with filename "certificate-of-insurance.pdf"
  - Support email templates (configurable per LOB/geography)
  - Support test mode (log email instead of sending in dev/test environments)
  - Implement retry logic for transient failures (3 retries with exponential backoff)
  - Track delivery status (sent, failed, bounced)
  - Return email envelope and messageId on success
- [ ] Copy and organize email templates:
  - Copy [emailBody.html](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/template/emailBody.html) to `src/delivery/templates/`
  - Rename to `coi-email-en.html`
  - Support template variables (dynamic content)
  - Prepare for multiple languages (future: `coi-email-fr.html`)
  - Create template loading utility
- [ ] Create `DeliveryOrchestrator`:
  - Coordinate full delivery workflow (MVP):
    1. Generate PDF (existing pipeline)
    2. Deliver via email (current)
  - Note: S3/database persistence is deferred in MVP.
  - Support multiple delivery channels (extensible):
    - Email delivery (current)
    - API webhook delivery (future)
    - Portal notification (future)
  - Handle delivery failures gracefully (don't fail entire COI generation)
  - Track delivery attempts and status
  - Support async delivery (queue-based, optional)
- [ ] Add delivery tracking:
  - Store delivery status in database (`DeliveryRecord` collection)
  - Track: sent timestamp, delivery status, recipient, messageId
  - Support delivery status queries via API (for debugging)
  - Track email opens/clicks (optional, future enhancement)
- [ ] Update [src/generator/generateCOI.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/generateCOI.mjs):
  - Accept `recipientEmail` in input parameters
  - Call `DeliveryOrchestrator` after PDF generation
  - Return both pdfBytes and delivery status
- [ ] Update [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs):
  - Pass `recipientEmail` to generateCOI
  - Remove console.log placeholder
  - Add proper structured logging for email success/failure
- [ ] Add environment variables:
  - `EMAIL_SENDER` - From email address
  - `SUPPORT_EMAIL` - BCC support email
  - `EMAIL_BCC3` - Additional BCC email
  - `EMAIL_TEST_MODE` - Enable test mode (true/false)
- [ ] Make delivery pluggable:
  - `DeliveryChannelInterface` - abstract interface for delivery channels
  - Easy to add new channels (webhook, SMS, push notification)
- [ ] Add comprehensive tests:
  - Unit tests for EmailService
  - Integration tests with mock SMTP server
  - Test email test mode
  - Test retry logic
  - Test delivery tracking
- [ ] Document delivery SLA:
  - Expected delivery time
  - Retry policies
  - Failure handling

### Technical Notes

- Same email template used for both US and Canada (currently)
- Delivery should be decoupled from generation (could be async)
- Email sent after PDF generation completes
- Test mode should log email content instead of sending
- Consider SQS-based async delivery for better reliability (future)

### Reference Files (Do Not Modify)

- [certificateOfInsurance/generate.ts:36-52](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/generate.ts#L36-L52) - Canada email sending
- [UScertificateOfInsurance/generate.ts:66-82](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts#L66-L82) - US email sending
- [emailBody.html](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/template/emailBody.html) - Email template

### Dependencies

- **Depends on:** Stories 0–3 (Post-MVP)

---

## Story 5: Service API & Event Interface

**Story ID:** COI-5
**Priority:** High
**Story Points:** 13
**Phase:** 5 - Interface Layer
**Epic:** COI-2024

### Description

Build API and event interfaces for COI-MVP service. Support both synchronous (REST API for admin/testing) and asynchronous (event-driven for production) invocation patterns.

### What Already Exists

- [DONE] [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs) - Demo handler with hardcoded invocations
- [DONE] [src/types.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/types.mjs) - `COIRequested` and `COILobGenerationCompleted` event constructors
- [DONE] `handler()` function that processes COI requests

### Acceptance Criteria

#### Part A: Event Interface (Primary Production Interface)

- [ ] Create `src/api/` directory structure
- [ ] Create Lambda event handler for EventBridge/SNS:
  - Update [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs)
  - Remove hardcoded demo invocations (lines 31-80)
  - Make `handler()` the Lambda entry point
  - Parse EventBridge/SNS event wrapper → extract `COIRequested` payload
  - Validate event payload against schema
  - Add MongoDB connection management (connect on cold start, reuse connections)
  - Add S3 client initialization
  - Add comprehensive error handling and logging
  - Emit `COILobGenerationCompleted` events to EventBridge/SNS after each LOB completes
  - Return Lambda response: `{ statusCode, body }`
- [ ] Define event schemas using JSON Schema:
  - `COIRequested` schema:
    ```json

    - Convert `.mjs` files to `.ts` with strict TypeScript settings.
    - Establish final folder layout under `src/` for ETL (extract/transform/map/load), data layer, and config.
    - Add Jest (ts-jest), ESLint, and Prettier; update `package.json` scripts.
    - Add environment management with `.env.example` and required variables.
    - Move Canada HTML helpers to `src/generator/load/canada/helpers.ts`.
    - Stage US ACORD JSON forms under `src/config/forms/`.
    - Keep current generation working via transitional adapters during migration.
    - Document dependent functions mapping in [docs/story0-implementation.md](docs/story0-implementation.md).
      "applicationId": "string",
      "policyFoxdenId": "string",

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
        story0-implementation.md # Detailed guide
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
      "timeZone": "string",
      "carrierPartner": "string",

  - `COILobGenerationCompleted` schema:
    ```json

      - Canada COI: [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
      - US COI: [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
      "status": "success | failed",
      "error": "string | null",
      "timestamp": "ISO8601"
    }
    ```
  - Validate all events against schemas
- [ ] Add event publishing service:
  - Publish completion events to EventBridge or SNS
  - Include trace context (X-Ray trace ID)
  - Support event replay (store event payload for debugging)
  - Handle publishing failures gracefully
- [ ] Create Lambda deployment configuration:
  - Add `package.json` scripts for building Lambda package
  - Configure Lambda layers for dependencies (pdf-lib, handlebars, etc.)
  - Document Lambda environment variables
  - Lambda settings:
    - Runtime: Node.js 20
    - Timeout: 5 minutes (300 seconds)
    - Memory: 1536 MB (for PDF operations)
    - VPC configuration (if needed for MongoDB access)
    - Reserved concurrency: 10 (adjust based on load)
- [ ] Add CloudWatch logging integration:
  - Structured JSON logs with context: `{ applicationId, policyFoxdenId, lob, geography, carrierPartner, stage, duration }`
  - Log each pipeline stage with timing
  - Log group: `/aws/lambda/coi-mvp-{env}`
- [ ] Add X-Ray tracing:
  - Instrument handler with AWS X-Ray SDK
  - Add custom segments for each stage: extract, transform, map, load, persist, email
  - Add subsegments for MongoDB queries, S3 uploads, Browserless calls
- [ ] Add dead letter queue (DLQ) configuration:
  - SQS DLQ for failed Lambda invocations
  - Retention: 7 days
  - Alarm on DLQ message count > 0

#### Part B: REST API (Alternative/Admin Interface)

- [ ] Create REST API endpoints using Express or API Gateway:
  - `POST /api/v1/coi/generate`
    - Synchronous generation (for testing/admin use)
    - Accept same payload as COIRequested event
    - Return: `{ jobId, status, pdfUrl? }`
    - Require API key authentication
  - `GET /api/v1/coi/status/:jobId`
    - Check generation status
    - Return: `{ jobId, status, lobs: [...], s3Keys: [...], errors: [...] }`
  - `GET /api/v1/coi/download/:jobId/:lob`
    - Download generated PDF
    - Return: PDF file or presigned S3 URL
  - `GET /api/v1/health`
    - Health check endpoint
    - Return: `{ status: "ok", version, timestamp, dependencies: {...} }`
  - `GET /api/v1/config` (admin only)
    - View active configuration
    - Require admin authentication
    - Return: Current COI_CONFIGS
  - `POST /api/v1/config/reload` (admin only)
    - Reload configuration from source
    - Require admin authentication
- [ ] Add API Gateway integration:
  - API key authentication for all endpoints
  - Rate limiting (100 requests/minute per key)
  - CORS configuration for admin UI
  - Request/response logging
  - Request validation (JSON Schema)
- [ ] Create OpenAPI/Swagger documentation:
  - Document all endpoints with examples
  - Generate from code or maintain separately
  - Serve at `/api/docs`

#### Part C: Integration Documentation

- [ ] Create integration guide (`docs/INTEGRATION.md`):
  - How to publish COIRequested events (with examples)
  - How to consume COILobGenerationCompleted events
  - How to call REST API for testing
  - Error handling patterns
  - Retry strategies
  - Example event payloads
- [ ] Create client libraries (optional):
  - Node.js client for publishing events
  - Example integration code for foxden-policy-document-backend
  - TypeScript type definitions

#### Part D: Testing

- [ ] Add API/event tests:
  - Event handler unit tests
  - REST API endpoint tests
  - Event publishing tests
  - Error handling tests (invalid payload, missing fields)
  - Retry logic tests
  - Authentication tests

### Technical Notes

- **Event interface is primary** (async, scalable, production use)
- **REST API is secondary** (admin, testing, debugging)
- Keep interface clean - no LOB/geography-specific logic in API layer
- Lambda in VPC has cold start implications - consider provisioned concurrency for production
- Use Lambda layers for large dependencies to reduce deployment package size
- Event flow: External service → EventBridge/SNS → Lambda (COI-MVP) → emit completion event → downstream consumers

### Reference Files

- **COI-MVP:**
  - [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs) - Current demo handler
  - [src/types.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/types.mjs) - Event constructors

### Dependencies

- **Depends on:** Story 5 (Delivery)
- **Can parallelize with:** Story 7

---

## Story 6: Testing & Quality Assurance

**Story ID:** COI-6
**Priority:** High
**Story Points:** 13
**Phase:** 6 - Testing
**Epic:** COI-2024

### Description

Build comprehensive test suite for COI-MVP. Ensure feature parity with reference system and production readiness.

### Acceptance Criteria

#### Part A: Test Infrastructure Setup

- [ ] Set up test framework:
  - Install Jest or Vitest as test runner
  - Configure test environment with TypeScript/ESM support
  - Set up test coverage reporting (Istanbul/nyc)
  - Configure test scripts in package.json:
    - `npm test` - Run all tests
    - `npm run test:unit` - Unit tests only
    - `npm run test:integration` - Integration tests only
    - `npm run test:coverage` - Run with coverage report
    - `npm run test:watch` - Watch mode for development
- [ ] Set up test dependencies:
  - MongoDB in-memory server (`mongodb-memory-server`)
  - LocalStack for S3 testing
  - Mock SMTP server for email testing
  - Mock Browserless API (or use test token with low rate limit)
- [ ] Create test fixtures:
  - Real production data structures (anonymized)
  - US policy/quote/application data (StateNational and Munich)
  - Canada policy/quote/application data
  - Edge cases: missing fields, invalid data, boundary values
  - Store in `test/fixtures/` directory
- [ ] Create test utilities:
  - MongoDB test helpers (setup/teardown)
  - S3 test helpers (LocalStack client)
  - PDF parsing utilities (for validation)
  - Assertion helpers for canonical model

#### Part B: Unit Tests (Target: >80% Coverage)

- [ ] **Data Layer Tests** (`src/data/`) - Test all ported functions from Story 1:
  - MongoDbClient: connection, retry, error handling
  - **PolicyDataExtractor.findPolicyHead():** Test MongoDB aggregation matches old system output
  - **generateNamedInsured():** Test with/without DBA, matches old system format
  - **getPolicyIdByLineOfBusiness():** Test with GL/EO/BOP, matches old system output
  - **CertificateNumberService.getNextCertificateNumber():** Test atomic increment, concurrent generation (fix for old system bug)
  - **ProfessionLookupService.getProfessionNames():** Test code→name conversion, caching
  - **getLatestActivePolicy():** Test policy metadata fetch
  - **getCarrierFromPolicy():** Test carrier name extraction
  - Compare all outputs with old system (regression tests)
  - Test edge cases: missing policies, invalid data, network failures
- [ ] **Transform Layer Tests** (`src/generator/transform/`):
  - US coverage transformation (all limit types)
  - Canada GL coverage transformation (all coverage types)
  - Canada EO coverage transformation
  - Canada optional coverages (pollution, unmanned aircraft)
  - Date normalization and formatting
  - Address formatting (block format for US, structured for Canada)
  - Named insured generation with DBA variations
  - Edge cases: nulls, missing data, invalid types, empty arrays, negative numbers
  - Numeric string conversion (Canada)
- [ ] **Mapping Layer Tests** (`src/generator/map/`):
  - Field mapping correctness for all configs
  - Lodash.get path resolution
  - Missing field handling (should not throw)
  - Nested object mapping
- [ ] **Delivery Layer Tests** (`src/delivery/`):
  - EmailService: email sending, test mode, retry logic
  - DeliveryOrchestrator: coordination logic
  - Template loading and rendering
- [ ] **Configuration Tests** (`src/generator/config/`):
  - Config loading from files
  - Config validation (invalid configs should fail fast)
  - Config caching and reload
  - Carrier-specific config selection

#### Part C: Integration Tests

- [ ] **End-to-End COI Generation:**
  - US GL COI with StateNational carrier
  - US GL COI with Munich carrier
  - US EO COI with StateNational carrier
  - US EO COI with Munich carrier
  - Canada GL COI with Foxquilt carrier
  - Verify PDF output structure and content
  - Verify S3 upload (using LocalStack)
  - Verify COIRecord database insertion
  - Verify email sending (using mock SMTP)
- [ ] **Pipeline Integration:**
  - Extract → Transform → Map → Load flow
  - Error handling at each stage
  - Logging and tracing validation
  - Performance timing validation
- [ ] **Event Handler Integration:**
  - Lambda handler receives event
  - Processes multiple LOBs
  - Emits completion events
  - Handles failures and DLQ

#### Part D: PDF Validation Tests

- [ ] **US ACORD 25 PDF Validation:**
  - Parse generated PDFs using pdf-lib or pdf-parse
  - Extract all text field values from PDF
  - Verify field values match input data
  - Test date formatting (MM-dd-yyyy)
  - Test currency formatting ($X,XXX with commas)
  - Verify checkbox states
  - Verify signature image presence and quality
  - Verify certificate holder block formatting (multi-line)
- [ ] **Canada HTML PDF Validation:**
  - Parse generated PDFs (extract text)
  - Verify all content sections present (insured, coverages, dates, etc.)
  - Test date formatting (yyyy/MM/dd)
  - Test currency formatting (CAD $X,XXX)
  - Test province name conversion (ON → Ontario)
  - Verify coverage structure rendering
- [ ] **Golden PDF Comparison:**
  - Generate COIs with reference system (old)
  - Generate COIs with new system
  - Compare outputs field-by-field using PDF parsing
  - Document acceptable differences:
    - Exact timestamps will differ
    - PDF metadata (creation date, tool version)
    - Minor formatting differences (spacing, line breaks)
  - Fail test if critical differences found

#### Part E: Performance Tests

- [ ] **Generation Duration Benchmarks:**
  - Measure time for single COI generation
  - Target: < 10 seconds for US, < 15 seconds for Canada (Browserless call)
  - Track percentiles: p50, p95, p99
- [ ] **Concurrent Generation:**
  - Test with 10 concurrent COI generations
  - Test with 100 concurrent COI generations
  - Verify no memory leaks (use heap snapshots)
  - Verify database connection pooling works correctly
- [ ] **Load Testing:**
  - Simulate production load (100 COIs/hour)
  - Monitor Lambda metrics (duration, memory, errors)
  - Identify bottlenecks

#### Part F: Regression Tests

- [ ] **Production Data Testing:**
  - Collect 20+ real production policies (anonymized PII)
  - Run through new system
  - Compare with old system outputs
  - Validate all outputs are equivalent (within acceptable differences)
- [ ] **Edge Case Testing:**
  - Missing optional fields
  - Maximum field lengths
  - Special characters in names/addresses
  - Multiple optional coverages enabled
  - All LOB combinations

#### Part G: Coverage Requirements

- [ ] Achieve minimum code coverage:
  - Extract layer: >85%
  - Transform layer: >90%
  - Map layer: >85%
  - Load layer: >75%
  - Delivery layer: >80%
  - Overall: >80%
- [ ] Set up CI/CD to fail on coverage regression

### Technical Notes

- Use snapshot testing for HTML generation (Canada)
- Mock Browserless API in tests to avoid token usage costs
- Use real ACORD 25 PDF template for tests (copy from templates/)
- Consider visual regression testing for PDFs (e.g., percy.io, pixelmatch)
- Run tests in parallel for faster CI/CD
- Use test containers for MongoDB and LocalStack in CI

### Dependencies

- **Depends on:** All previous stories (tests entire system)
- **Continuous:** Should be ongoing throughout development

---

## Story 7: Production Deployment & Operations

**Story ID:** COI-7
**Priority:** High
**Story Points:** 13
**Phase:** 7 - Production
**Epic:** COI-2024

### Description

Deploy COI-MVP as production-ready service with monitoring, alerting, and operational readiness.

### Acceptance Criteria

#### Part A: Environment & Secrets Management

- [ ] Create comprehensive `.env.example`:
  ```
  # MongoDB
  MONGODB_URI=mongodb://localhost:27017/foxquilt

  # AWS
  AWS_REGION=us-east-1
  COI_S3_BUCKETNAME=foxquilt-coi-prod

  # Browserless
  BROWSERLESS_API_TOKEN=your-token-here

  # Email
  EMAIL_SENDER=noreply@foxquilt.com
  SUPPORT_EMAIL=support@foxquilt.com
  EMAIL_BCC3=analytics@foxquilt.com
  EMAIL_TEST_MODE=false

  # EventBridge/SNS
  COI_EVENTS_TOPIC_ARN=arn:aws:sns:us-east-1:123456789012:coi-events

  # Logging
  LOG_LEVEL=info
  ```
- [ ] Remove all hardcoded secrets:
  - Remove hardcoded Browserless token from [loadPdf.mjs:29](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/load/loadPdf.mjs#L29)
  - Ensure no tokens or credentials in code
  - Add validation that fails on startup if required env vars missing
- [ ] Create environment-specific configs:
  - `config/env/dev.json` - Development environment
  - `config/env/staging.json` - Staging environment
  - `config/env/prod.json` - Production environment (template, actual secrets in AWS Secrets Manager)
- [ ] Integrate AWS Secrets Manager:
  - Store sensitive credentials:
    - `/foxquilt/coi-mvp/prod/browserless-token`
    - `/foxquilt/coi-mvp/prod/mongodb-uri`
    - `/foxquilt/coi-mvp/prod/email-credentials`
  - Create secrets loading utility that reads from Secrets Manager
  - Cache secrets on Lambda cold start with TTL (5 minutes)
  - Support secret rotation without Lambda restart
- [ ] Add IAM policy for secret access:
  ```json
  {
    "Effect": "Allow",
    "Action": ["secretsmanager:GetSecretValue"],
    "Resource": "arn:aws:secretsmanager:*:*:secret:/foxquilt/coi-mvp/*"
  }
  ```

#### Part B: Infrastructure as Code

- [ ] Create infrastructure definitions (AWS CDK or Terraform):
  - **Lambda Function:**
    - Runtime: Node.js 20
    - Handler: `src/index.handler`
    - Timeout: 300 seconds (5 minutes)
    - Memory: 1536 MB
    - Environment variables (reference Secrets Manager)
    - VPC configuration (if MongoDB in VPC)
    - Reserved concurrency: 10 (adjust based on load testing)
  - **Lambda Layer:** Dependencies (pdf-lib, handlebars, etc.)
  - **EventBridge:**
    - Rule: Match `COIRequested` events
    - Target: Lambda function
    - DLQ: SQS queue
  - **SNS Topics:**
    - `coi-requests` - Incoming COI requests
    - `coi-completions` - Outgoing completion events
  - **SQS Queues:**
    - `coi-requests-queue` - Main queue (optional, for buffering)
    - `coi-requests-dlq` - Dead letter queue
    - Retention: 7 days
  - **API Gateway:** (for REST API)
    - REST API with API key authentication
    - Rate limiting: 100 req/min per key
    - CORS enabled
  - **IAM Roles and Policies:**
    - Lambda execution role
    - S3 read/write permissions
    - MongoDB VPC access (if needed)
    - SES send email permissions
    - Secrets Manager read permissions
    - EventBridge publish permissions
  - **CloudWatch Log Groups:**
    - `/aws/lambda/coi-mvp-prod`
    - Retention: 30 days
  - **CloudWatch Alarms:**
    - Lambda errors > 5% for 5 minutes
    - Lambda duration > 200 seconds (p99)
    - DLQ message count > 0
    - S3 upload failures > 5 in 10 minutes
    - Email send failures > 5 in 10 minutes

#### Part C: Observability

- [ ] **Structured Logging:**
  - Implement logging service in `src/utils/logger.js`
  - JSON format with consistent schema:
    ```json
    {
      "timestamp": "2024-01-15T10:30:00.000Z",
      "level": "info",
      "message": "COI generation started",
      "context": {
        "applicationId": "app_123",
        "policyFoxdenId": "POL-123",
        "lob": "GL",
        "geography": "US",
        "carrierPartner": "StateNational",
        "stage": "extract",
        "duration": null
      },
      "traceId": "1-5f...",
      "requestId": "abc-123"
    }
    ```
  - Log each pipeline stage: extract, transform, map, load, persist, email
  - Log timings for performance analysis
  - Log all external operations (S3, MongoDB, Browserless, SES)
- [ ] **CloudWatch Metrics:**
  - Custom metrics:
    - `COIGeneration.Success` (by LOB, geography, carrier)
    - `COIGeneration.Failure` (by LOB, geography, carrier)
    - `COIGeneration.Duration` (percentiles: p50, p95, p99)
    - `S3Upload.Failures`
    - `EmailSend.Failures`
    - `MongoDB.QueryDuration`
  - Lambda built-in metrics:
    - Invocations
    - Errors
    - Duration
    - Throttles
    - Concurrent executions
- [ ] **X-Ray Tracing:**
  - Initialize X-Ray SDK in Lambda handler
  - Create custom segments:
    - `extract` - Data extraction from MongoDB
    - `transform` - Canonical model building
    - `map` - Field mapping
    - `load` - PDF generation
    - `persist` - S3 upload + database write
    - `email` - Email delivery
  - Create subsegments for external calls:
    - MongoDB queries
    - S3 uploads
    - Browserless API calls
    - SES email sends
  - Include metadata: `{ lob, geography, carrierPartner }`
- [ ] **CloudWatch Dashboard:**
  - Create dashboard: "COI-MVP Production"
  - Widgets:
    - COI generation volume (by LOB, geography) - 24h trend
    - Success rate (%) - 24h trend
    - Error count - 24h trend
    - Duration (p50, p95, p99) - 24h trend
    - Lambda metrics (invocations, errors, throttles)
    - S3 upload metrics
    - Email delivery metrics
    - MongoDB query duration
    - Cost metrics (Lambda invocations, Browserless API calls)
- [ ] **Error Tracking:**
  - Integrate Sentry or Rollbar
  - Initialize in Lambda handler
  - Capture unhandled errors and rejections
  - Add context tags: `{ applicationId, lob, geography, environment }`
  - Set up alerting:
    - Critical errors → Page on-call
    - Warnings → Slack notification
  - Configure error grouping and deduplication

#### Part D: Deployment Pipeline

- [ ] **Set up CI/CD (GitHub Actions):**
  - `.github/workflows/test.yml` - Run tests on PR
  - `.github/workflows/deploy-dev.yml` - Deploy to dev on merge to main
  - `.github/workflows/deploy-staging.yml` - Deploy to staging (manual approval)
  - `.github/workflows/deploy-prod.yml` - Deploy to prod (manual approval)
- [ ] **Build process:**
  - Lint code (ESLint)
  - Run all tests
  - Check test coverage (fail if < 80%)
  - Build Lambda package (zip with dependencies)
  - Build Lambda layer (dependencies only)
  - Upload to S3
- [ ] **Deployment script:** (`scripts/deploy.sh`)
  - Accept environment parameter (dev/staging/prod)
  - Update Lambda function code
  - Update Lambda layer
  - Update environment variables
  - Update infrastructure (CDK/Terraform)
  - Run smoke tests
  - Tag release in Git
- [ ] **Smoke Test Suite:**
  - Generate 1 US GL COI (StateNational)
  - Generate 1 US EO COI (Munich)
  - Generate 1 Canada GL COI
  - Verify S3 uploads
  - Verify database records
  - Verify email sent (to test recipient)
  - All tests must pass in < 60 seconds
  - Run after every deployment
- [ ] **Rollback Procedure:**
  - Document rollback steps
  - Store previous Lambda version
  - One-command rollback: `./scripts/rollback.sh prod`
  - Test rollback in staging

#### Part E: Operational Documentation

- [ ] **Update README.md:**
  - Service overview
  - Architecture diagram
  - Quick start guide
  - Local development setup
  - Testing instructions
  - Deployment instructions
- [ ] **Create Operational Runbook** (`docs/RUNBOOK.md`):
  - Service architecture overview
  - How to check if service is healthy
  - How to view logs (CloudWatch Logs Insights queries)
  - How to view metrics (CloudWatch Dashboard links)
  - How to trace a specific COI generation (X-Ray)
  - How to reprocess failed COI requests (from DLQ)
  - How to update configuration (config reload)
  - How to rotate secrets (Secrets Manager)
  - Common issues and solutions:
    - PDF generation taking too long (Browserless timeout)
    - S3 upload failures (permissions, quota)
    - Email send failures (SES limits, bounce rate)
    - MongoDB connection failures (VPC, credentials)
  - Emergency contacts and escalation
  - On-call procedures
- [ ] **Create Troubleshooting Guide** (`docs/TROUBLESHOOTING.md`):
  - How to debug COI generation failures
  - How to compare old vs new output
  - How to test locally with production data
  - How to replay failed events
- [ ] **Architecture Decision Records** (`docs/adr/`):
  - ADR-001: ETL Pipeline Architecture
  - ADR-002: Event-Driven Design
  - ADR-003: MongoDB vs Other Databases
  - ADR-004: pdf-lib vs Puppeteer for US COI
  - ADR-005: Browserless for Canada COI

#### Part F: Cost Monitoring

- [ ] **Set up AWS Cost Explorer:**
  - Tag Lambda with: `Service=coi-mvp`, `Environment=prod`
  - Track costs by service: Lambda, S3, SES, Secrets Manager
  - Track Browserless API costs separately (external)
- [ ] **Create cost alerts:**
  - Alert if monthly Lambda cost > $500
  - Alert if monthly S3 cost > $100
  - Alert if Browserless API usage > expected (track via custom metric)
- [ ] **Cost optimization:**
  - Use Lambda reserved concurrency to control max spend
  - Use S3 Intelligent-Tiering for old COI PDFs
  - Monitor and optimize Lambda memory (balance cost vs performance)
  - Consider caching for profession lookups (reduce DB queries)

### Technical Notes

- Lambda in VPC has cold start penalty - monitor and optimize
- Use Lambda layers to reduce deployment package size (< 50 MB)
- Set up provisioned concurrency only if needed (adds cost but eliminates cold starts)
- Monitor Lambda throttling and adjust concurrency limits
- Use X-Ray for debugging production issues - invaluable for distributed tracing

### Dependencies

- **Depends on:** All previous stories (deploys complete system)

---

## Story 8: Production Readiness & Documentation

**Story ID:** COI-8
**Priority:** High
**Story Points:** 8
**Phase:** 8 - Launch Prep
**Epic:** COI-2024

### Description

Final production readiness checks, comprehensive documentation, and service launch preparation.

### Acceptance Criteria

#### Part A: Production Readiness Checklist

- [ ] **Security Review:**
  - No secrets or credentials in code
  - All API endpoints require authentication
  - Rate limiting configured
  - IAM policies follow least privilege principle
  - Secrets rotation documented and tested
  - VPC security groups configured (if applicable)
  - HTTPS/TLS for all external communications
  - Input validation on all endpoints
- [ ] **Performance Validation:**
  - Load testing completed (100+ concurrent COI generations)
  - Duration benchmarks met:
    - US COI: < 10 seconds (p95)
    - Canada COI: < 15 seconds (p95)
  - Memory usage stable (no leaks)
  - Database connection pooling working correctly
  - Lambda cold starts < 3 seconds
- [ ] **Monitoring & Alerting:**
  - All CloudWatch alarms configured and tested
  - PagerDuty/Slack integration working
  - Dashboard shows real-time metrics
  - Log aggregation working
  - X-Ray tracing validated
  - Error tracking (Sentry) receiving errors
- [ ] **Testing:**
  - All tests passing (unit, integration, E2E)
  - Test coverage > 80%
  - Regression tests passing (comparison with old system)
  - Smoke tests passing in all environments
- [ ] **Disaster Recovery:**
  - Backup procedures documented
  - Restore procedures tested
  - RTO (Recovery Time Objective) defined: < 1 hour
  - RPO (Recovery Point Objective) defined: < 5 minutes
  - DLQ monitoring and replay procedures tested
- [ ] **Operational Readiness:**
  - Runbook completed
  - On-call procedures documented
  - Escalation paths defined
  - Team trained on new system
  - Troubleshooting guide completed

#### Part B: Comprehensive Documentation

- [ ] **Service Documentation** (`docs/README.md`):
  - Service overview and purpose
  - Architecture diagram (high-level)
  - Technology stack
  - Key features and capabilities
  - Supported LOBs, geographies, carriers
  - SLA and performance characteristics
- [ ] **API Documentation** (`docs/API.md`):
  - REST API endpoints (OpenAPI spec)
  - Event schemas (JSON Schema)
  - Authentication and authorization
  - Rate limits and quotas
  - Error codes and handling
  - Example requests and responses
- [ ] **Integration Guide** (`docs/INTEGRATION.md`):
  - How to publish COIRequested events
  - How to consume COILobGenerationCompleted events
  - How to call REST API (for testing/admin)
  - Error handling patterns
  - Retry strategies
  - Example code (Node.js, TypeScript)
  - Troubleshooting common integration issues
- [ ] **Configuration Guide** (`docs/CONFIGURATION.md`):
  - How to add new LOB (step-by-step)
  - How to add new geography (step-by-step)
  - How to add new carrier (step-by-step)
  - How to update field mappings
  - How to update email templates
  - Configuration schema reference
  - Configuration validation and testing
- [ ] **Deployment Guide** (`docs/DEPLOYMENT.md`):
  - Prerequisites (AWS account, permissions)
  - Infrastructure setup (CDK/Terraform)
  - Environment configuration
  - Secrets management
  - Deployment process (dev → staging → prod)
  - Smoke testing
  - Rollback procedures
  - Monitoring post-deployment
- [ ] **Architecture Decision Records** (`docs/adr/`):
  - Document all major technical decisions
  - Rationale for ETL pipeline approach
  - Why event-driven architecture
  - Database choice
  - Renderer choices (pdf-lib vs Puppeteer)
  - Browserless for Canada COI
- [ ] **Changelog** (`CHANGELOG.md`):
  - Version history
  - Changes from old system
  - Breaking changes
  - Migration notes

#### Part C: Load Testing

- [ ] **Realistic Load Testing:**
  - Simulate production load: 100 COIs/hour sustained for 1 hour
  - Simulate peak load: 500 COIs/hour for 10 minutes
  - Simulate burst: 50 concurrent COI requests
  - Test with realistic data (mix of US/Canada, different LOBs)
- [ ] **Performance Metrics:**
  - Measure and document:
    - Throughput (COIs/minute)
    - Duration (p50, p95, p99)
    - Error rate (%)
    - Resource utilization (CPU, memory)
    - Cost per COI
- [ ] **Scalability Testing:**
  - Test Lambda auto-scaling
  - Test MongoDB connection pool behavior under load
  - Test S3 upload concurrency
  - Identify bottlenecks
  - Document scaling limits
- [ ] **Endurance Testing:**
  - Run continuous load for 24 hours
  - Monitor for memory leaks
  - Monitor for connection leaks
  - Verify logs don't fill disk
  - Verify metrics collection stable

#### Part D: Chaos Engineering (Optional)

- [ ] **Failure Scenario Testing:**
  - Test MongoDB failure (simulate network partition)
    - Verify error handling
    - Verify retry logic
    - Verify events go to DLQ
  - Test S3 failure (simulate permission denied)
    - Verify graceful degradation
    - Verify error logging
  - Test Browserless API failure (simulate timeout)
    - Verify retry logic
    - Verify fallback behavior
  - Test SES failure (simulate throttling)
    - Verify retry logic
    - Verify email queue handling
- [ ] **Verify Graceful Degradation:**
  - Service should not crash on external failures
  - Errors should be logged properly
  - Failed COI requests should go to DLQ for later retry
  - Partial success should be possible (e.g., 2 of 3 LOBs succeed)

#### Part E: Service Launch

- [ ] **Deploy to Production:**
  - Deploy Lambda function
  - Deploy infrastructure (EventBridge, SNS, SQS)
  - Deploy monitoring and alerting
  - Verify all health checks passing
  - Verify no errors in logs
- [ ] **Run Production Smoke Tests:**
  - Generate test COI in production (using test policy)
  - Verify S3 upload
  - Verify database record
  - Verify email sent
  - Verify completion event published
  - Clean up test data
- [ ] **Service is Ready (but not receiving production traffic yet):**
  - Service deployed and healthy
  - Monitoring dashboards active
  - On-call rotation setup
  - Team trained and ready
  - **Ready for integration** (foxden-policy-document-backend will switch traffic separately)
- [ ] **Announce Service Availability:**
  - Send announcement to engineering team
  - Update team wiki/Confluence
  - Share dashboard links
  - Share runbook and on-call procedures
  - Schedule knowledge-sharing session

#### Part F: Post-Launch Monitoring Plan

- [ ] **First 48 Hours:**
  - Monitor dashboards continuously
  - Check logs every 2 hours
  - Verify no errors or warnings
  - Track all metrics against baselines
  - Be ready for immediate rollback
- [ ] **First Week:**
  - Daily monitoring and metrics review
  - Review all DLQ messages
  - Track cost vs projections
  - Collect feedback from users (if any test traffic)
  - Document any issues and resolutions
- [ ] **First Month:**
  - Weekly metrics review
  - Performance optimization based on production data
  - Update documentation based on learnings
  - Fine-tune alarms (reduce false positives)
  - Plan for improvements

### Technical Notes

- Service is ready for production but not yet receiving traffic (integration is separate effort)
- Focus on operational excellence - better to catch issues before traffic switch
- Document everything - future maintainers will thank you
- Load testing in production (with test data) is valuable - do it

### Dependencies

- **Depends on:** Story 9 (Deployment)
- **Final story before launch**

---

## Epic Summary

### Timeline & Resources

**Total Estimated Timeline:** 10-12 weeks (reduced due to code reuse)
**Total Story Points:** 93

### Parallelization Opportunities

- **Stories 5, 6, 7** can be partially parallelized (different team members)
- **Story 8** (Testing) should be ongoing throughout all phases
- **Story 7** (Signatures) is independent and can be done anytime

### Key Principles

[DONE] **DO NOT** modify [foxden-policy-document-backend](https://github.com/Foxquilt/foxden-policy-document-backend)
[DONE] **REUSE proven code** from old system (port/copy existing functions, don't rewrite)
[DONE] **Copy MongoDB aggregation logic** exactly as-is (it's tested and works in production)
[DONE] **Port helper functions** directly (generateNamedInsured, getPolicyIdByLineOfBusiness, etc.)
[DONE] **Fix known bugs** during porting (e.g., certificate number concurrency issue)
[DONE] Build [COI-MVP](https://github.com/HesterGong/COI-MVP) as standalone, general, configurable service
[DONE] Support future business expansion (new LOBs, geographies, carriers)
[DONE] Production-ready with proper monitoring and operations
[DONE] Event-driven architecture for scalability
[DONE] Configuration-driven (minimal code changes for new business)

### Success Metrics

- **Feature Parity:** All US/Canada COI generation capabilities replicated
- **Performance:** US < 10s, Canada < 15s (p95)
- **Reliability:** > 99.9% success rate
- **Test Coverage:** > 80% across all layers
- **Documentation:** Complete API docs, runbooks, integration guides
- **Operational Readiness:** Deployed with monitoring, alerting, on-call procedures

### Next Steps After Launch

The service will be deployed and ready to receive traffic. Integration with [foxden-policy-document-backend](https://github.com/Foxquilt/foxden-policy-document-backend) will be handled separately by that team (not part of this epic). The integration will likely involve:

1. Publishing COIRequested events from GraphQL mutations
2. Feature flag for gradual rollout
3. Parallel validation (shadow mode)
4. Traffic cutover and monitoring
5. Deprecation of old system

**Note:** Integration and cutover are separate initiatives and not included in this epic scope.

---

## Appendix: Repository Links

### COI-MVP (New System)
- **Repository:** https://github.com/HesterGong/COI-MVP
- **Key Files:**
  - [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs) - Main handler
  - [src/generator/generateCOI.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/generateCOI.mjs) - COI generation entry point
  - [src/generator/pipeline/runPipeline.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/pipeline/runPipeline.mjs) - ETL pipeline
  - [src/generator/transform/transform.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/transform/transform.mjs) - Transform layer
  - [src/generator/config/coiConfig.local.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/config/coiConfig.local.mjs) - Configuration
  - [README.md](https://github.com/HesterGong/COI-MVP/blob/main/README.md) - Project documentation

### foxden-policy-document-backend (Reference System - DO NOT MODIFY)
- **Repository:** https://github.com/Foxquilt/foxden-policy-document-backend
- **Reference Files:**
  - [src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts) - Canada COI entry point
  - [src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts) - US COI entry point
  - [src/services/certificateOfInsurance/generate.ts](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/generate.ts) - Canada COI generation
  - [src/services/UScertificateOfInsurance/generate.ts](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts) - US COI generation

---

**Epic Status:** Ready for Planning
**Last Updated:** 2024-01-15
**Version:** 1.0
