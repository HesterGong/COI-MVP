# COI Coverage Matrix - 100% Coverage Tracking

**Purpose:** Track what needs to be ported from old system to ensure nothing is missed.

**How to Use:** Check off items as you implement them. All items must be checked for 100% coverage.

---

## Master Coverage Status

| Category | Items | Completed | Story |
|----------|-------|-----------|-------|
| **Data Extraction** | 18 fields | 0/18 | Story 1 |
| **Helper Functions** | 7 functions | 0/7 | Story 1 |
| **Validations** | 8 checks | 0/8 | Story 1 |
| **Transformations** | 12 transforms | 0/12 | Story 2 |
| **PDF Generation** | 2 methods | 0/2 | Story 2 |
| **Delivery** | 3 components | 0/3 | Story 4 |
| **Configuration** | 4 configs | 0/4 | Story 3 |

---

## 1. Data Extraction Coverage (Story 1)

### 1.1 Canada COI - Data Fields

**Source:** `sendCertificateOfInsurance.ts` lines 36-56

| Field | Source Path | Type | Validation | Status |
|-------|-------------|------|------------|--------|
| **businessName** | `applicationAnswers.data.answers.BusinessInformation_100_CompanyName_WORLD_EN` | string | Required | ☐ |
| **dbaName** | `applicationAnswers.data.answers.BusinessInformation_100_DBAName_WORLD_EN` | string | Optional | ☐ |
| **namedInsuredAddress** | `applicationAnswers.data.answers.BusinessInformation_100_MailingAddress_WORLD_EN` | Address | isAddressType() | ☐ |
| **rawProfession** | `applicationAnswers.data.answers.BusinessInformation_100_Profession_WORLD_EN` | string \| string[] | → array | ☐ |
| **timeZone** | `applicationAnswers.data.timeZone` | CanadaTimeZone | Required | ☐ |
| **effectiveDate** | `policy.data.coverage.effectiveDate` | Date | typeof !== 'string' | ☐ |
| **expiryDate** | `policy.data.coverage.expiryDate` | Date | Required | ☐ |
| **carrierPartner** | `policy.data.carrierPartner` | string | Fallback to default | ☐ |
| **recipientEmail** | `applicationOwner.data.authenticatedEmail` | string | Required | ☐ |

**Special Processing:**
- ☐ Handle profession as both `string` and `string[]` → normalize to `string[]`
- ☐ Apply `isAddressType()` validation to address
- ☐ Fallback to `defaultCarrierPartner` if null

### 1.2 Canada COI - Coverage Limits

**Source:** `sendCertificateOfInsurance.ts` lines 90-140

| Limit Field | Type | Conversion | Status |
|-------------|------|------------|--------|
| **aggregateLimit** | string → number | Number() | ☐ |
| **deductible** | string → number | Number() | ☐ |
| **limitedPollutionLiabilityOccurrenceLimit** | string → number | Number() | ☐ |
| **medicalPaymentsLimit** | string → number | Number() | ☐ |
| **occurrenceLimit** | string → number | Number() | ☐ |
| **tenantLegalLiabilityLimit** | string → number | Number() | ☐ |
| **miscellaneousEODeductible** | string → number | Number() (if EO) | ☐ |
| **miscellaneousEOOccurrenceLimit** | string → number | Number() (if EO) | ☐ |
| **miscellaneousEOAggregateLimit** | string → number | Number() (if EO) | ☐ |
| **limitedCoverageForUnmannedAircraftLimit** | string → number | Number() (if enabled) | ☐ |

**Boolean Flags:**
- ☐ `limitedPollutionLiability` (boolean validation)
- ☐ `limitedCoverageForUnmannedAircraft` (boolean validation)
- ☐ `miscellaneousEO` (boolean validation)

**Critical:** All limits come as **strings** in Canada and MUST be converted to numbers.

### 1.3 US COI - Data Fields

**Source:** `sendUsCertificateOfInsurance.ts` lines 38-52

| Field | Source Path | Type | Validation | Status |
|-------|-------------|------|------------|--------|
| **businessName** | `applicationAnswers.data.answers.BusinessInformation_100_CompanyName_WORLD_EN` | string | Required | ☐ |
| **dbaName** | `applicationAnswers.data.answers.BusinessInformation_100_DBAName_WORLD_EN` | string | Optional | ☐ |
| **professionList** | `applicationAnswers.data.answers.professionLabelList` | string[] | isArray() | ☐ |
| **businessAddress** | `applicationAnswers.data.answers.BusinessInformation_100_BusinessAddress_WORLD_EN` | Address | isAddressType() | ☐ |
| **timeZone** | `applicationAnswers.data.timeZone` | string | Required | ☐ |
| **recipientEmail** | `applicationOwner.data.authenticatedEmail` | string | Required | ☐ |

**Note:** Different address field than Canada (BusinessAddress vs MailingAddress)

### 1.4 US COI - Coverage Limits

**Source:** `sendUsCertificateOfInsurance.ts` lines 78-88

| Limit Field | Source | Type | Status |
|-------------|--------|------|--------|
| **policyEffectiveDate** | `quote.rating.input.GL.policyEffectiveDate` | Date | ☐ |
| **policyExpirationDate** | `quote.rating.input.GL.policyExpirationDate` | Date | ☐ |
| **occurrenceLimit** | `quote.rating.input.GL.occurrenceLimit` | number | ☐ |
| **premisesRentedToYouLimit** | `quote.rating.input.GL.premisesRentedToYouLimit` | number | ☐ |
| **medicalPaymentsLimit** | `quote.rating.input.GL.medicalPaymentsLimit` | number | ☐ |
| **aggregateLimit** | `quote.rating.input.GL.aggregateLimit` | number | ☐ |

**Critical Differences:**
- ☐ Dates come from **quote**, not policy
- ☐ Limits are **already numbers**, no conversion needed

### 1.5 US COI - Special Fields

**Source:** `sendUsCertificateOfInsurance.ts` lines 90-101

| Field | Logic | Status |
|-------|-------|--------|
| **policyNumber** | `getPolicyIdByLineOfBusiness(policyData.policies, PolicyKind.GL)` | ☐ |
| **certificateNumber** | `db.COIRecord.countDocuments() + 1` ⚠️ Concurrency bug | ☐ |

**Validation:**
- ☐ `policyData.kind === Kind.Root` (throw error otherwise)
- ☐ `quoteData.rating.kind !== 'Canada'` (throw error otherwise)

---

## 2. Helper Functions Coverage (Story 1)

### 2.1 Functions to Port

| Function | Source File | Lines | Purpose | Status |
|----------|-------------|-------|---------|--------|
| **findPolicyHead()** | `services/utils/findPolicyHead.ts` | 29-195 | MongoDB aggregation to get PolicyView | ☐ |
| **generateNamedInsured()** | `utils/generateNamedInsured.ts` | 1-16 | Format `"CompanyName"` or `"CompanyName DBA DbaName"` | ☐ |
| **isAddressType()** | `utils/address/isAddressType.ts` | 6-20 | Validate address has city, street, province, postalCode | ☐ |
| **getPolicyIdByLineOfBusiness()** | `services/utils/getPolicyIdByLineOfBusiness.ts` | 11-19 | Extract GL policy ID from policies array | ☐ |
| **getLatestActivePolicy()** | `services/utils/getLatestPolicy.ts` | 11-43 | Query ActivePolicy → Policy by policyFoxdenId | ☐ |
| **getCarrierFromPolicy()** | `services/utils/saveInsuranceDocumentUtils.ts` | 21-34 | Get carrier name from policy + country | ☐ |
| **getProfessionNameList()** | `services/policyDocument/utils/getProfessionNameList.ts` | 3-13 | Map profession codes → display names | ☐ |

### 2.2 MongoDB Aggregation Pipeline

**findPolicyHead() Pipeline (MUST copy exactly):**

**Source:** `findPolicyHead.ts` lines 33-146

| Stage | Purpose | Status |
|-------|---------|--------|
| ☐ | `$match` on policyFoxdenId | ☐ |
| ☐ | `$project` activePolicy as ROOT | ☐ |
| ☐ | `$lookup` Policy collection | ☐ |
| ☐ | `$unwind` policy | ☐ |
| ☐ | `$lookup` ApplicationAnswers | ☐ |
| ☐ | `$unwind` applicationAnswers (preserve null) | ☐ |
| ☐ | `$lookup` PolicyQuote | ☐ |
| ☐ | `$unwind` policyQuote | ☐ |
| ☐ | `$lookup` Quote | ☐ |
| ☐ | `$unwind` quote (preserve null) | ☐ |
| ☐ | `$project` conditional applicationAnswers (Root vs Endorsement) | ☐ |
| ☐ | `$lookup` ApplicationOwner | ☐ |
| ☐ | `$unwind` applicationOwner (preserve null) | ☐ |
| ☐ | `$lookup` Application | ☐ |
| ☐ | `$unwind` application (preserve null) | ☐ |

**Version Checks:**
- ☐ ApplicationAnswers version === 7
- ☐ Policy version === 6
- ☐ Quote version === 9

---

## 3. Validation Coverage (Story 1)

### 3.1 Canada COI Validations

**Source:** `sendCertificateOfInsurance.ts`

| Validation | Line | Logic | Status |
|------------|------|-------|--------|
| **Address type** | 64 | `isAddressType(namedInsuredAddress)` | ☐ |
| **Date type** | 70 | `typeof effectiveDate !== 'string'` | ☐ |
| **Quote kind** | 75 | `quoteData.rating.kind === 'Canada'` | ☐ |
| **Quote type** | 79 | `quoteData.kind === QuoteKind.Original` | ☐ |
| **Pollution boolean** | 110 | `typeof limitedPollutionLiability === 'boolean'` | ☐ |
| **Aircraft boolean** | 116 | `typeof limitedCoverageForUnmannedAircraft === 'boolean'` | ☐ |
| **EO boolean** | 122 | `typeof miscellaneousEO === 'boolean'` | ☐ |

### 3.2 US COI Validations

**Source:** `sendUsCertificateOfInsurance.ts`

| Validation | Line | Logic | Status |
|------------|------|-------|--------|
| **Address type** | 72 | `isAddressType(businessAddress)` | ☐ |
| **Quote kind** | 59 | `quoteData.rating.kind !== 'Canada'` | ☐ |
| **Quote type** | 65 | `quoteData.kind === QuoteKind.Original` | ☐ |
| **Policy kind** | 99 | `policyData.kind === Kind.Root` | ☐ |
| **Profession array** | 103 | `isArray(professionList)` | ☐ |

---

## 4. Transformation Coverage (Story 2)

### 4.1 Canada COI - Coverage Structure

**Source:** `sendCertificateOfInsurance.ts` lines 166-203

| Coverage | Fields | Conditional | Status |
|----------|--------|-------------|--------|
| **GL - General Aggregate** | amount, deductible | Always | ☐ |
| **GL - Each Occurrence** | amount, deductible | Always | ☐ |
| **GL - Product/Completed Ops** | amount, deductible | Always | ☐ |
| **GL - Personal/Advertising Injury** | amount, deductible | Always | ☐ |
| **GL - Medical Payments** | amount, deductible | Always | ☐ |
| **GL - Tenant Legal Liability** | amount, deductible | Always | ☐ |
| **GL - Pollution Extension** | amount, deductible | If `limitedPollutionLiability === true` | ☐ |
| **EO Coverage** | deductible, aggregateAmount, occurrenceAmount | If `miscellaneousEO === true` | ☐ |
| **Others - Unmanned Aircraft** | name, limit (amount, deductible) | If `limitedCoverageForUnmannedAircraft === true` | ☐ |

**Named Insured:**
- ☐ Apply `generateNamedInsured(businessName, dbaName)`

**Insurance Company:**
- ☐ Hardcoded: `"Certain Underwriters at Lloyd's of London"`

**Profession:**
- ☐ Apply `getProfessionNameList(professionList)` to get display names

### 4.2 US COI - Input Structure

**Source:** `sendUsCertificateOfInsurance.ts` lines 107-122

| Field | Transformation | Status |
|-------|----------------|--------|
| **insured** | Multi-line: `"${namedInsured}\n${street}\n${city}, ${province}, ${postalCode}"` | ☐ |
| **description** | Join: `professionList.join(', ')` | ☐ |
| **certificateNumber** | Generated from DB count | ☐ |
| **policyNumber** | From `getPolicyIdByLineOfBusiness()` | ☐ |
| **effectiveDate** | From quote (not policy) | ☐ |
| **expirationDate** | From quote (not policy) | ☐ |
| **limits** | Use as-is (already numbers) | ☐ |

---

## 5. PDF Generation Coverage (Story 2)

### 5.1 Canada COI - HTML + Handlebars

**Source:** `certificateOfInsurance/generate.ts`

| Component | Implementation | Status |
|-----------|----------------|--------|
| **Handlebars Template** | Copy from `template/template.handlebars` | ☐ |
| **Helper: formatCurrency** | `Intl.NumberFormat('en-CA', { currency: 'CAD', minimumFractionDigits: 0 })` | ☐ |
| **Helper: formatDate** | `localizeToDateString({ formatStr: 'yyyy/MM/dd', timeZone })` | ☐ |
| **Helper: toLongProvinceName** | `unabbreviate(province)` - ON → Ontario | ☐ |
| **Browserless Call** | `html2pdf({ html, options, BROWSERLESS_API_TOKEN })` | ☐ |
| **PDF Options** | Format: A4, margins: 0.5in top/bottom, printBackground: true | ☐ |

### 5.2 US COI - ACORD 25 PDF Form

**Source:** `UScertificateOfInsurance/generate.ts`

| Component | Implementation | Status |
|-----------|----------------|--------|
| **Base PDF** | Load `acord_25_2016-03.pdf` | ☐ |
| **Form Config Selection** | StateNational OR Munich based on `carrierPartner` | ☐ |
| **Text Fields** | `form.getTextField(name).setText(value)` | ☐ |
| **Checkboxes** | `form.getCheckBox(name).check()` if value matches expected | ☐ |
| **Date Formatting** | `localizeToDateString({ formatStr: 'MM-dd-yyyy', timeZone })` | ☐ |
| **Currency Formatting** | `formatCurrency(value, false)` - with grouping | ☐ |
| **Signature Embedding** | `embedPng(signatureImg)` - StateNational OR Munich | ☐ |
| **Certificate Holder** | Multi-line: `"${name}\n${street}\n${city}, ${province}, ${postalCode}"` | ☐ |

---

## 6. Delivery Coverage (Story 4)

### 6.1 Email Delivery

**Sources:** Both `generate.ts` files

| Component | Implementation | Status |
|-----------|----------------|--------|
| **Email Template** | Copy `template/emailBody.html` | ☐ |
| **From** | `EMAIL_SENDER` env var | ☐ |
| **To** | `recipientEmail` from policy | ☐ |
| **BCC** | `[SUPPORT_EMAIL, EMAIL_BCC3]` env vars | ☐ |
| **Subject** | "Foxquilt Insurance - Certificate of Insurance" | ☐ |
| **Attachment** | `certificate-of-insurance.pdf` | ☐ |
| **Transporter** | `createTransport({ logger, testMode: false })` | ☐ |

### 6.2 S3 Upload

**Sources:** Both `generate.ts` files

| Component | Implementation | Status |
|-----------|----------------|--------|
| **File Name (Canada)** | `${policyFoxdenId}|${additionalInsuredName}|${Date.now()}.pdf` | ☐ |
| **File Name (US)** | `${policyNumber}|${certificateNumber}|${Date.now()}.pdf` | ☐ |
| **InsuranceDocumentManager** | Use from `@foxden/shared-lib` | ☐ |
| **S3 Client** | `new S3Client({})` | ☐ |
| **Bucket** | `COI_S3_BUCKETNAME` env var | ☐ |
| **Document Type** | `InsuranceDocumentDocumentType.Certificate` | ☐ |
| **Transaction Type** | `InsuranceDocumentTransactionType.Certificate` | ☐ |

### 6.3 Database Record

**Sources:** Both `generate.ts` files

| Component | Implementation | Status |
|-----------|----------------|--------|
| **Collection** | `COIRecord` | ☐ |
| **Version** | 6 | ☐ |
| **Operation Name** | `sendCertificateOfInsurance` / `generateUsCoiPDF` | ☐ |
| **Fields** | `additionalInsured`, `policyFoxdenId`, `s3Response`, `carrierPartner` | ☐ |
| **Generate Object** | `generateDBObject(DocumentName.COIRecord, version, name, data)` | ☐ |

---

## 7. Configuration Coverage (Story 3)

### 7.1 Form Configs

| File | Source | Destination | Status |
|------|--------|-------------|--------|
| **StateNational Forms** | `configs/UScoiFormsConfigs-StateNational.json` | `src/config/forms/` | ☐ |
| **Munich Forms** | `configs/UScoiFormsConfigs-Munich.json` | `src/config/forms/` | ☐ |

### 7.2 Signature Assets

| File | Source | Destination | Status |
|------|--------|-------------|--------|
| **StateNational Signature** | `USpolicydocument/stateNational/StateNationalPresidentSignature.png` | `templates/signatures/` | ☐ |
| **Munich Signature** | `USpolicydocument/munich/MunichUSSignature.png` | `templates/signatures/` | ☐ |

### 7.3 Templates

| File | Source | Destination | Status |
|------|--------|-------------|--------|
| **ACORD 25 PDF** | `assets/acord_25_2016-03.pdf` | `templates/acord25/` | ☐ |
| **Canada HTML** | `template/template.handlebars` | `templates/html/` | ☐ |
| **Email HTML** | `template/emailBody.html` | `src/delivery/templates/coi-email-en.html` | ☐ |

### 7.4 Hardcoded Values to Config

| Value | Current | Should Be | Status |
|-------|---------|-----------|--------|
| **Canada Insurance Company** | `"Certain Underwriters at Lloyd's of London"` | `config.geography.canada.insuranceCompany` | ☐ |
| **Canada Date Format** | `'yyyy/MM/dd'` | `config.geography.canada.dateFormat` | ☐ |
| **Canada Currency** | `'CAD'` | `config.geography.canada.currency` | ☐ |
| **US Date Format** | `'MM-dd-yyyy'` | `config.geography.us.dateFormat` | ☐ |
| **US Currency** | `'USD'` | `config.geography.us.currency` | ☐ |

---

## 8. Environment Variables Coverage

| Variable | Used By | Required | Status |
|----------|---------|----------|--------|
| **MONGODB_URI** | MongoDB client | Yes | ☐ |
| **COI_S3_BUCKETNAME** | S3 upload | Yes | ☐ |
| **BROWSERLESS_API_TOKEN** | Canada PDF generation | Yes | ☐ |
| **EMAIL_SENDER** | Email delivery | Yes | ☐ |
| **SUPPORT_EMAIL** | Email BCC | Yes | ☐ |
| **EMAIL_BCC3** | Email BCC | Yes | ☐ |
| **EMAIL_TEST_MODE** | Email testing | No | ☐ |

---

## 9. Critical Differences Checklist

### Must Get Right

| Difference | Canada | US | Verified |
|------------|--------|-----|----------|
| **Address Field** | `MailingAddress_WORLD_EN` | `BusinessAddress_WORLD_EN` | ☐ |
| **Profession Field** | `Profession_WORLD_EN` (string\|array) | `professionLabelList` (array) | ☐ |
| **Date Source** | `policy.data.coverage` | `quote.rating.input.GL` | ☐ |
| **Date Format** | `yyyy/MM/dd` | `MM-dd-yyyy` | ☐ |
| **Limit Types** | Strings → convert to numbers | Already numbers | ☐ |
| **Quote Check** | `rating.kind === 'Canada'` | `rating.kind !== 'Canada'` | ☐ |
| **PDF Method** | HTML + Browserless | ACORD 25 + pdf-lib | ☐ |
| **Certificate Number** | Not used | Generated from DB count | ☐ |

---

## Completion Checklist

### Story 0: Setup
- ☐ All configuration files created
- ☐ All folders created
- ☐ All assets copied
- ☐ All .mjs files converted to .ts
- ☐ TypeScript compiles without errors

### Story 1: Data Layer
- ☐ All 18 fields extracted (9 Canada + 9 US)
- ☐ All 7 helper functions ported
- ☐ All 12 validations implemented
- ☐ MongoDB aggregation copied exactly

### Story 2: Transform & Load
- ☐ All 9 Canada GL coverages built correctly
- ☐ Conditional EO coverage works
- ☐ Conditional others array works
- ☐ US multi-line string formatting correct
- ☐ Canada HTML + Handlebars rendering works
- ☐ US ACORD 25 form filling works
- ☐ Both carrier signatures embed correctly

### Story 3: Configuration
- ☐ All 2 form configs copied
- ☐ All 2 signatures copied
- ☐ All 3 templates copied
- ☐ All 5 hardcoded values moved to config

### Story 4: Delivery
- ☐ Email template rendered
- ☐ Email sent with correct BCC
- ☐ PDF attached correctly
- ☐ S3 upload works
- ☐ DB record inserted

---

## Quick Reference

**Old System Code:**
- Canada: `~/Desktop/repos/foxden-policy-document-backend/src/services/certificateOfInsurance/`
- US: `~/Desktop/repos/foxden-policy-document-backend/src/services/UScertificateOfInsurance/`

**New System:**
- Root: `/home/hestergong/Downloads/coi-mvp-etl/`
- Docs: `docs/COVERAGE_MATRIX.md` (this file)

**Detailed Analysis:** See [COVERAGE_ANALYSIS.md](./COVERAGE_ANALYSIS.md) for line-by-line details.

---

**Last Updated:** 2026-02-09
**Format:** Coverage Tracking Matrix v1.0
