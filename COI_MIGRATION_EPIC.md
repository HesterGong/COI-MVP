# EPIC: Build Production-Ready COI Generation Service (COI-MVP)

## 🤖 For AI Agents

**📋 START HERE:** [docs/AI_AGENT_INSTRUCTIONS.md](./docs/AI_AGENT_INSTRUCTIONS.md)

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
**Estimated Timeline:** 10-12 weeks
**Team Size:** 2-3 engineers

### Description

Build a production-ready, standalone COI generation service based on [COI-MVP](https://github.com/HesterGong/COI-MVP) that replicates all functionality from [foxden-policy-document-backend](https://github.com/Foxquilt/foxden-policy-document-backend) COI generation. The new service will be general, config-driven, and ready for future business expansion.

**IMPORTANT:** No changes to foxden-policy-document-backend - this is a clean, standalone replacement.

### Implementation Strategy

**REUSE PROVEN CODE:** This epic emphasizes porting existing, production-tested code from the old system rather than rewriting from scratch. Key functions like `findPolicyHead`, `generateNamedInsured`, `getPolicyIdByLineOfBusiness`, and data extraction logic will be copied and adapted (TypeScript → JavaScript/ESM) to ensure feature parity and reduce implementation risk. Only fix known bugs (e.g., certificate number concurrency) during porting.

### Repository Context

- **Reference (Old System):** https://github.com/Foxquilt/foxden-policy-document-backend - **DO NOT MODIFY**
- **Target (New System):** https://github.com/HesterGong/COI-MVP - **Build standalone service**

### What Already Exists in COI-MVP

- ✅ ETL pipeline architecture (Extract → Transform → Map → Load)
- ✅ US ACORD 25 PDF renderer (pdf-lib)
- ✅ Canada HTML → PDF renderer (Browserless)
- ✅ Config-driven LOB/geography/carrier selection
- ✅ Canonical data model and field mappings
- ✅ Fixture-based MVP data

### Success Criteria

- ✅ Standalone service with API/event interface
- ✅ Feature parity with old system
- ✅ General/configurable for new LOBs, geographies, carriers
- ✅ Fully tested and production-ready
- ✅ Deployed and ready to receive traffic

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

**📋 Implementation Guide:** [docs/story1-implementation.md](./docs/story1-implementation.md)

### Scope

**Remove:**
- ❌ `src/fixtures.mjs` - MVP fixture data (entire file)
- ❌ `src/generator/extract/fixtures.mjs` - Duplicate fixtures

**Create:**
- ➕ TypeScript setup (`tsconfig.json`, update `package.json`)
- ➕ `src/data/` - New data layer with ported functions
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
- ✏️ `src/generator/extract/extract.mjs` → `extract.ts` - Replace fixtures with real MongoDB
- ✏️ `src/index.mjs` → `index.ts` - Add MongoDB initialization

### Acceptance Criteria

- [ ] **Setup TypeScript** - Add tsconfig.json, update package.json with TypeScript + MongoDB dependencies
- [ ] **Port 6 core functions** from old system (see implementation guide for exact sources):
  - `findPolicyHead` → `PolicyDataExtractor.ts` (MongoDB aggregation - copy exactly)
  - `generateNamedInsured` → `generateNamedInsured.ts` (15 lines - copy exactly)
  - `getPolicyIdByLineOfBusiness` → `getPolicyIdByLineOfBusiness.ts` (19 lines - copy exactly)
  - `getLatestActivePolicy` → `PolicyMetadataService.ts`
  - `getCarrierFromPolicy` → `CarrierInfoService.ts`
  - `getProfessionNameList` → `ProfessionLookupService.ts`
- [ ] **Create CertificateNumberService** - Fix concurrency bug in old system (atomic `findOneAndUpdate` instead of `countDocuments`)
- [ ] **Create MongoDbClient** - Connection wrapper with pooling and retry logic
- [ ] **Update extract layer** - Replace fixture logic with real MongoDB extraction:
  - `extractCanadaData()` - Port from [sendCertificateOfInsurance.ts:36-108](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts#L36-L108)
  - `extractUSData()` - Port from [sendUsCertificateOfInsurance.ts:38-98](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts#L38-L98)
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
- Old: `countDocuments()` (has race condition)
- New: `findOneAndUpdate({ $inc })` (atomic operation)

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

Enhance [src/generator/transform/transform.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/transform/transform.mjs) to handle real production data structures for both US and Canada. Make transformations general and configurable for future LOBs.

**NOTE:** This story uses helper functions ported in Story 1 (`generateNamedInsured`, `getProfessionNameList`). The extracted data from Story 1 flows into this transform layer.

### What Already Exists

- ✅ [src/generator/transform/transform.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/transform/transform.mjs) - Basic canonical model builder
- ✅ `buildCanonical()` function with basic field normalization
- ✅ Address formatting utilities (`addressLine`, `insuredBlock`)

### Acceptance Criteria

- [ ] Enhance `buildCanonical()` for US GL/EO coverage:
  - Extract limits from `UsCommonRatingInput`: `occurrenceLimit`, `premisesRentedToYouLimit`, `medicalPaymentsLimit`, `aggregateLimit`
  - Use quote dates (`policyEffectiveDate`, `policyExpirationDate`) not policy dates
  - Extract LOB-specific policy numbers using `getPolicyIdByLineOfBusiness()`
  - Build insured block format: `"Name\nStreet\nCity, State, Zip"`
- [ ] Enhance `buildCanonical()` for Canada GL coverage:
  - Build structured `gl` object: `generalAggregate`, `eachOccurrence`, `productAndCompletedOperationsAggregate`, `personalAndAdvertisingInjuryLiability`, `medicalPayments`, `tenantLegalLiability`
  - Each coverage with `{ amount, deductible }` structure
  - Add optional `pollutionLiabilityExtension` based on `limitedPollutionLiability` boolean flag
- [ ] Add Canada EO coverage extraction:
  - Check `miscellaneousEO` boolean flag
  - If true, build `eo` object: `{ deductible, aggregateAmount, occurrenceAmount }`
- [ ] Add Canada optional coverages ("others" array):
  - Unmanned aircraft coverage (if `limitedCoverageForUnmannedAircraft === true`)
  - Build array: `[{ name: 'Unmanned aircraft', limit: { amount, deductible } }]`
- [ ] Create transformation utilities:
  - **ALREADY PORTED IN STORY 1:** Use `generateNamedInsured(businessName, dbaName)` from `src/data/utils/generateNamedInsured.js`
  - `formatInsuredBlock(name, address)` - format US insured block (port from [sendUsCertificateOfInsurance.ts:108](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts#L108))
  - `extractLimitsFromRating(ratingInput, lob)` - generic limit extraction
  - `buildCoverageStructure(ratingInput, geography)` - geography-specific coverage builder
- [ ] Handle numeric string conversions:
  - Canada sends numbers as strings - convert to proper number types
  - Validate numeric ranges
- [ ] Make transformations data-driven:
  - Coverage field mappings in config (not hardcoded in transform)
  - Support for new LOBs without code changes
  - Geography-specific transformation plugins (strategy pattern)
- [ ] Add validation layer:
  - Required field validation
  - Type checking (dates, numbers, strings)
  - Range validation for limits and dates
- [ ] Update `canonical` structure to support both US and Canada:
  - US: simple flat limits object
  - Canada: nested coverage structure `{ gl: {...}, eo?: {...}, others: [...] }`
- [ ] Add `canonical.insurer` field with insurance company name
- [ ] Add comprehensive unit tests for all transformation scenarios
- [ ] Document canonical model schema (JSON Schema or TypeScript types)

### Technical Notes

- Canonical model should be LOB/geography agnostic
- Transformations should be pluggable using strategy pattern
- Consider using JSON Schema for validation
- **US Structure:** Simple flat limits, insured as text block
- **Canada Structure:** Nested coverage objects, structured address
- **Boolean Flags (Canada):** `limitedPollutionLiability`, `limitedCoverageForUnmannedAircraft`, `miscellaneousEO`

### Reference Files (Do Not Modify)

- [sendCertificateOfInsurance.ts:90-203](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts#L90-L203) - Canada coverage structure
- [sendUsCertificateOfInsurance.ts:78-122](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts#L78-L122) - US limits extraction

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

Enhance configuration system to be fully production-ready and general for future business. Move configurations out of code into external config files.

### What Already Exists

- ✅ [src/generator/config/coiConfig.local.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/config/coiConfig.local.mjs) - Basic COI_CONFIGS
- ✅ [src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json)

### Acceptance Criteria

- [ ] Create organized `config/` directory structure:
  - `config/lobs/` - LOB-specific configs (GL.json, EO.json, BOP.json, etc.)
  - `config/geographies/` - Geography-specific configs (US.json, CA.json)
  - `config/carriers/` - Carrier-specific configs (StateNational.json, Munich.json, etc.)
  - `config/templates/` - Template metadata and mappings
- [ ] Enhance COI config structure in [coiConfig.local.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/config/coiConfig.local.mjs):
  - Add all missing field mappings:
    - US: `recipientEmail`, `dateNow`, `usEmail`, `usPhoneNumber`, `insuranceCompany`
    - Canada: `dateNow`, `recipientEmail`, verify `insuranceCompany`
  - Add Munich carrier configurations for GL and EO
  - Make configs easily extensible for new LOBs/geographies/carriers
- [ ] Copy Munich form config:
  - Copy [UScoiFormsConfigs-Munich.json](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/configs/UScoiFormsConfigs-Munich.json) to COI-MVP
  - Place in `src/generator/config/form-configs/UScoiFormsConfigs-Munich.json`
  - Reference in Munich carrier configs
- [ ] Create config validation:
  - JSON Schema for all config file types
  - Startup validation (fail fast if config invalid)
  - Config version management and compatibility checks
- [ ] Create `ConfigLoader` service:
  - Load configs from files or S3/remote config store
  - Support config hot-reloading (without service restart)
  - Config caching with TTL
  - Environment-specific config overrides
- [ ] Organize form configs by carrier:
  - `config/form-configs/StateNational-GL.json`
  - `config/form-configs/StateNational-EO.json`
  - `config/form-configs/Munich-GL.json`
  - `config/form-configs/Munich-EO.json`
  - Support form config versioning
- [ ] Create configuration documentation:
  - Config schema reference
  - How to add new LOB (step-by-step guide)
  - How to add new geography
  - How to add new carrier
  - Field mapping reference
- [ ] Add config API endpoint (for debugging/admin):
  - `GET /api/config` - View active configuration
  - `POST /api/config/reload` - Reload configuration
  - Require admin authentication

### Technical Notes

- Configs should be declarative (minimal/no code changes for new LOBs)
- Consider using AWS AppConfig or similar for remote config management
- Config changes should not require deployment (hot reload)
- System defaults: `usEmail: "support@foxquilt.com"`, `usPhoneNumber: "(888) 555-0100"`
- US forms differ by carrier (StateNational vs Munich) - different PDF field names

### Reference Files (Do Not Modify)

- [UScoiFormsConfigs-Munich.json](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/configs/UScoiFormsConfigs-Munich.json)
- [generate.ts:92-100](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts#L92-L100) - System field injection

### Dependencies

- **Depends on:** Story 2 (Transform Layer)

---

## Story 4: Persistence Layer (S3 & Database)

**Story ID:** COI-4
**Priority:** High
**Story Points:** 10
**Phase:** 4 - Persistence
**Epic:** COI-2024

### Description

Build complete persistence layer for S3 uploads and COIRecord database writes. Make it general and reusable for all LOBs and geographies.

**NOTE:** This story uses helper functions ported in Story 1 (`getLatestActivePolicy`, `getCarrierFromPolicy`) for fetching policy metadata needed for S3/DB operations.

### What Already Exists

- ✅ [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs) - Currently writes to `./out` directory
- ✅ [src/generator/generateCOI.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/generateCOI.mjs) - Returns PDF bytes

### Acceptance Criteria

- [ ] Create `src/persistence/` directory structure
- [ ] Create `S3StorageService`:
  - Upload PDF files to S3 using `@aws-sdk/client-s3`
  - Integrate `InsuranceDocumentManager` from `@foxden/shared-lib`
  - Generate proper filenames:
    - US format: `{policyNumber}|{certificateNumber}|{timestamp}.pdf`
    - Canada format: `{policyFoxdenId}|{additionalInsuredName}|{timestamp}.pdf`
  - Store document metadata:
    - documentType: `InsuranceDocumentDocumentType.Certificate`
    - transactionType: `InsuranceDocumentTransactionType.Certificate`
    - bucket: `COI_S3_BUCKETNAME` (from environment)
    - carrier, policyNumber, policyObjectId, applicationId, carrierPartner
  - Handle upload failures with exponential backoff retry
  - Support multiple S3 buckets (configurable per environment)
  - Return S3 response: `{ ETag, Location, Bucket, Key }`
- [ ] Create `COIRecordService`:
  - Write COIRecord documents to MongoDB
  - Use `generateDBObject(DocumentName.COIRecord, 6, 'generateCOI', data)` helper
  - Store fields:
    - `additionalInsured` (Canada) or `certificateHolder` (US)
    - `policyFoxdenId`
    - `s3Response` (ETag, Location, Bucket, Key)
    - `carrierPartner`
  - Version: 6 (current production format)
  - Handle write failures with retry
  - Support MongoDB transactions
- [ ] Create `PersistenceOrchestrator`:
  - Coordinate S3 upload + database write operations
  - Execute in order:
    1. Upload PDF to S3
    2. Write COIRecord to database
    3. Return success/failure status
  - Handle partial failures:
    - If S3 fails: return error, don't write to database
    - If database fails: S3 already uploaded, log warning, return partial success
  - Implement configurable rollback strategy
  - Add idempotency support (don't duplicate if retried)
  - Use idempotency key: `{policyFoxdenId}-{lob}-{additionalInsuredName}-{timestamp}`
- [ ] Use ported metadata helper services from Story 1:
  - **ALREADY PORTED IN STORY 1:** Use `CarrierInfoService.getCarrierFromPolicy(policy)` from `src/data/services/CarrierInfoService.js`
  - **ALREADY PORTED IN STORY 1:** Use `PolicyMetadataService.getLatestActivePolicy(policyFoxdenId)` from `src/data/services/PolicyMetadataService.js` to fetch `_id` and `application._id`
- [ ] Make persistence layer pluggable:
  - `StorageInterface` - could swap S3 for Azure Blob, GCS, etc.
  - `DatabaseInterface` - could use different database
  - Dependency injection pattern
- [ ] Add comprehensive error handling:
  - Network failures
  - Authentication failures
  - Quota/rate limit errors
  - Timeout errors
- [ ] Add structured logging:
  - Log context: `{ applicationId, policyFoxdenId, lob, s3Key, operation, duration }`
  - Log S3 upload start/success/failure
  - Log database write start/success/failure
- [ ] Add integration tests:
  - Use LocalStack for S3 testing
  - Use test MongoDB instance
  - Test retry logic
  - Test partial failure scenarios
- [ ] Add dependencies to package.json:
  - `@foxden/shared-lib`
  - `@aws-sdk/client-s3`

### Technical Notes

- Service should be LOB/geography agnostic
- Consider event sourcing for audit trail
- InsuranceDocumentManager requires MongoDB client and S3 client instances
- Need to fetch policy again using `getLatestActivePolicy` to get ObjectId and application reference
- Transaction boundaries: Decide if S3 should be rolled back on DB failure (currently: no rollback)

### Reference Files (Do Not Modify)

- [certificateOfInsurance/generate.ts:170-209](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/generate.ts#L170-L209) - Canada S3/DB
- [UScertificateOfInsurance/generate.ts:189-227](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts#L189-L227) - US S3/DB

### Dependencies

- **Depends on:** Story 1 (Data Layer)
- **Can parallelize with:** Story 2, Story 3

---

## Story 5: Email & Delivery Service

**Story ID:** COI-5
**Priority:** High
**Story Points:** 8
**Phase:** 5 - Delivery
**Epic:** COI-2024

### Description

Build standalone email delivery service for COI PDFs. Make it general and support multiple delivery channels for future expansion.

### What Already Exists

- ✅ Console log placeholder in [src/index.mjs:26](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs#L26): `console.log('EMAIL SENT (log only): ${outPath}')`

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
  - Coordinate full delivery workflow:
    1. Generate PDF (existing pipeline)
    2. Store to S3 (Story 4)
    3. Write to database (Story 4)
    4. Deliver via email (new)
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
- Old system doesn't rollback S3 if email fails - maintain same behavior
- Email sent after S3 and DB operations complete (not before)
- Test mode should log email content instead of sending
- Consider SQS-based async delivery for better reliability (future)

### Reference Files (Do Not Modify)

- [certificateOfInsurance/generate.ts:36-52](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/generate.ts#L36-L52) - Canada email sending
- [UScertificateOfInsurance/generate.ts:66-82](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts#L66-L82) - US email sending
- [emailBody.html](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/certificateOfInsurance/template/emailBody.html) - Email template

### Dependencies

- **Depends on:** Story 4 (Persistence Layer)
- **Can parallelize with:** Story 6, Story 7

---

## Story 6: Service API & Event Interface

**Story ID:** COI-6
**Priority:** High
**Story Points:** 13
**Phase:** 6 - Interface Layer
**Epic:** COI-2024

### Description

Build API and event interfaces for COI-MVP service. Support both synchronous (REST API for admin/testing) and asynchronous (event-driven for production) invocation patterns.

### What Already Exists

- ✅ [src/index.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/index.mjs) - Demo handler with hardcoded invocations
- ✅ [src/types.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/types.mjs) - `COIRequested` and `COILobGenerationCompleted` event constructors
- ✅ `handler()` function that processes COI requests

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
    {
      "applicationId": "string",
      "policyFoxdenId": "string",
      "geography": "US | CA",
      "timeZone": "string",
      "carrierPartner": "string",
      "lobs": ["GL", "EO", ...],
      "additionalInsured": {
        "name": "string",
        "address": { "street", "city", "province", "postalCode" }
      },
      "recipientEmail": "string"
    }
    ```
  - `COILobGenerationCompleted` schema:
    ```json
    {
      "applicationId": "string",
      "policyFoxdenId": "string",
      "lob": "string",
      "geography": "string",
      "s3Key": "string",
      "s3Bucket": "string",
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

- **Depends on:** Story 4 (Persistence), Story 5 (Delivery)
- **Can parallelize with:** Story 7

---

## Story 7: Signature Assets & Carrier Configuration

**Story ID:** COI-7
**Priority:** Medium
**Story Points:** 3
**Phase:** 7 - Assets
**Epic:** COI-2024

### Description

Organize signature assets and implement carrier-specific signature selection logic. Make it general for future carriers.

### What Already Exists

- ✅ [src/generator/load/acord25/pdfGenerator.mjs:174-182](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/load/acord25/pdfGenerator.mjs#L174-L182) - Signature loading code (hardcoded path)
- ✅ [templates/signatures/](https://github.com/HesterGong/COI-MVP/tree/main/templates/signatures) directory (per README, but empty)

### Acceptance Criteria

- [ ] Copy signature images from reference repository:
  - Copy StateNational signature → `templates/signatures/StateNationalPresidentSignature.png`
  - Copy Munich signature → `templates/signatures/MunichUSSignature.png`
  - Verify image quality and dimensions
- [ ] Update [src/generator/load/acord25/pdfGenerator.mjs](https://github.com/HesterGong/COI-MVP/blob/main/src/generator/load/acord25/pdfGenerator.mjs):
  - Replace hardcoded signature path (line 174)
  - Implement carrier-based signature selection:
    ```javascript
    const signatureFilename =
      enrichedInput.carrierPartner === 'StateNational'
        ? 'StateNationalPresidentSignature.png'
        : enrichedInput.carrierPartner === 'Munich'
        ? 'MunichUSSignature.png'
        : 'signature.png'; // fallback
    const signaturePath = path.resolve(`templates/signatures/${signatureFilename}`);
    ```
  - Handle missing signature files gracefully:
    - Log warning if signature file not found
    - Don't fail entire COI generation
    - Continue without signature (or use generic fallback)
- [ ] Add generic fallback signature:
  - Create or copy generic signature image
  - Use as fallback for unknown carriers
- [ ] Create carrier configuration files:
  - `config/carriers/StateNational.json`:
    ```json
    {
      "name": "State National",
      "signaturePath": "templates/signatures/StateNationalPresidentSignature.png",
      "formsConfigPath": "src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json",
      "branding": {
        "logoPath": null,
        "primaryColor": null
      }
    }
    ```
  - `config/carriers/Munich.json`:
    ```json
    {
      "name": "Munich Re",
      "signaturePath": "templates/signatures/MunichUSSignature.png",
      "formsConfigPath": "src/generator/config/form-configs/UScoiFormsConfigs-Munich.json",
      "branding": {
        "logoPath": null,
        "primaryColor": null
      }
    }
    ```
  - Make adding new carriers require only config file (no code changes)
- [ ] Support carrier-specific branding (future extensibility):
  - Logo images (for letterhead)
  - Color schemes (for Canada HTML PDF)
  - Footer text
  - Prepare structure even if not used initially
- [ ] Add signature quality validation:
  - Validate image format (PNG)
  - Validate dimensions (warn if too small/large)
  - Validate file size (warn if too large)
- [ ] Add logging for signature operations:
  - Log signature loading success/failure
  - Log which signature used for each carrier
  - Log fallback usage
- [ ] Test signature rendering:
  - Generate US COI with StateNational carrier
  - Generate US COI with Munich carrier
  - Verify signatures appear correctly in PDFs
  - Verify PDF is valid with signature
- [ ] Create documentation:
  - How to add new carrier signatures
  - Signature image requirements (format, size, dimensions)
  - Carrier configuration schema

### Technical Notes

- Signatures only used for US ACORD 25 forms (not Canada HTML PDFs)
- Current code at line 174 tries to load `assets/signatures/signature.png` but directory doesn't exist
- README mentions `templates/signatures/` but notes it's "not automatically used by US generator today"
- Signature is added to PDF form button field: `US-Coi-signature`
- Use pdf-lib `embedPng()` to add signature to PDF

### Reference Files (Do Not Modify)

- [UScertificateOfInsurance/generate.ts:164-170](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/UScertificateOfInsurance/generate.ts#L164-L170) - Signature selection logic
- [StateNationalPresidentSignature.png](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/USpolicydocument/stateNational/StateNationalPresidentSignature.png)
- [MunichUSSignature.png](https://github.com/Foxquilt/foxden-policy-document-backend/blob/main/src/services/USpolicydocument/munich/MunichUSSignature.png)

### Dependencies

- **Can parallelize with:** Any other story (independent)

---

## Story 8: Testing & Quality Assurance

**Story ID:** COI-8
**Priority:** High
**Story Points:** 13
**Phase:** 8 - Testing
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
- [ ] **Persistence Layer Tests** (`src/persistence/`):
  - S3StorageService: upload success, retry on failure, error handling
  - COIRecordService: database writes, transaction handling
  - PersistenceOrchestrator: full flow, partial failure scenarios
  - Idempotency (duplicate requests)
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
  - Persistence layer: >80%
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

## Story 9: Production Deployment & Operations

**Story ID:** COI-9
**Priority:** High
**Story Points:** 13
**Phase:** 9 - Production
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

## Story 10: Production Readiness & Documentation

**Story ID:** COI-10
**Priority:** High
**Story Points:** 8
**Phase:** 10 - Launch Prep
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
**Total Story Points:** 93 (reduced from 102 due to porting approach)
**Recommended Team Size:** 2-3 engineers

### Phase Breakdown

| Phase | Stories | Story Points | Duration | Dependencies |
|-------|---------|--------------|----------|--------------|
| **Phase 1:** Foundation | Story 1 | 8 pts | 1.5 weeks | None (porting existing code) |
| **Phase 2:** Core Logic | Story 2 | 10 pts | 1.5 weeks | Story 1 |
| **Phase 3:** Configuration | Story 3 | 5 pts | 1 week | Story 2 |
| **Phase 4:** Persistence | Story 4 | 10 pts | 1.5 weeks | Story 1 (can parallelize with 2-3) |
| **Phase 5:** Delivery | Story 5 | 8 pts | 1.5 weeks | Story 4 (can parallelize with 6-7) |
| **Phase 6:** API/Events | Story 6 | 13 pts | 2 weeks | Stories 4, 5 |
| **Phase 7:** Assets | Story 7 | 3 pts | 0.5 weeks | Independent (can parallelize) |
| **Phase 8:** Testing | Story 8 | 13 pts | 2 weeks | All stories (ongoing throughout) |
| **Phase 9:** Deployment | Story 9 | 13 pts | 2 weeks | Story 8 |
| **Phase 10:** Launch Prep | Story 10 | 8 pts | 1 week | Story 9 |

### Parallelization Opportunities

- **Stories 4, 5, 6, 7** can be partially parallelized (different team members)
- **Story 8** (Testing) should be ongoing throughout all phases
- **Story 7** (Signatures) is independent and can be done anytime

### Key Principles

✅ **DO NOT** modify [foxden-policy-document-backend](https://github.com/Foxquilt/foxden-policy-document-backend)
✅ **REUSE proven code** from old system (port/copy existing functions, don't rewrite)
✅ **Copy MongoDB aggregation logic** exactly as-is (it's tested and works in production)
✅ **Port helper functions** directly (generateNamedInsured, getPolicyIdByLineOfBusiness, etc.)
✅ **Fix known bugs** during porting (e.g., certificate number concurrency issue)
✅ Build [COI-MVP](https://github.com/HesterGong/COI-MVP) as standalone, general, configurable service
✅ Support future business expansion (new LOBs, geographies, carriers)
✅ Production-ready with proper monitoring and operations
✅ Event-driven architecture for scalability
✅ Configuration-driven (minimal code changes for new business)

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
