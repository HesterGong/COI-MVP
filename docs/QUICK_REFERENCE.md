# COI Migration - Quick Reference Card

**Print this out and keep next to you while implementing!**

---

## 📋 What to Port - At a Glance

### Canada COI
```
Entry: sendCertificateOfInsurance.ts (232 lines)
Generate: generate.ts (222 lines)
Total: 454 lines

Fields: 9 data fields + 10 limit fields (strings→numbers)
Rendering: HTML + Handlebars + Browserless
```

### US COI
```
Entry: sendUsCertificateOfInsurance.ts (127 lines)
Generate: generate.ts (240 lines)
Total: 367 lines

Fields: 8 data fields + 6 limit fields (already numbers)
Rendering: ACORD 25 PDF form filling with pdf-lib
```

---

## 🗂️ Helper Functions (Story 1)

| # | Function | Lines | File |
|---|----------|-------|------|
| 1 | `findPolicyHead()` | 195 | `services/utils/findPolicyHead.ts` |
| 2 | `generateNamedInsured()` | 16 | `utils/generateNamedInsured.ts` |
| 3 | `isAddressType()` | 21 | `utils/address/isAddressType.ts` |
| 4 | `getPolicyIdByLineOfBusiness()` | 19 | `services/utils/getPolicyIdByLineOfBusiness.ts` |
| 5 | `getLatestActivePolicy()` | 44 | `services/utils/getLatestPolicy.ts` |
| 6 | `getCarrierFromPolicy()` | 35 | `services/utils/saveInsuranceDocumentUtils.ts` |
| 7 | `getProfessionNameList()` | 13 | `services/policyDocument/utils/getProfessionNameList.ts` |

**Action:** Copy these 7 functions EXACTLY as-is, then adapt for TypeScript.

---

## ⚠️ Critical Differences (DON'T MIX THESE UP!)

| What | Canada | US |
|------|--------|-----|
| **Address field** | `MailingAddress` | `BusinessAddress` |
| **Profession field** | `Profession_WORLD_EN` (string\|array) | `professionLabelList` (array) |
| **Dates source** | `policy.data.coverage` | `quote.rating.input.GL` |
| **Date format** | `yyyy/MM/dd` | `MM-dd-yyyy` |
| **Limits type** | **Strings** → convert to numbers | **Already numbers** |
| **Quote check** | `kind === 'Canada'` | `kind !== 'Canada'` |
| **Certificate #** | Not used | Generated from DB |

---

## 📝 String-to-Number (Canada ONLY!)

**Canada limits come as STRINGS and must be converted:**
```typescript
// CORRECT
const aggregateLimit = Number(aggregateLimitUnknown);
const deductible = Number(deductibleUnknown);
const occurrenceLimit = Number(occurrenceLimitUnknown);
// ... (9 total conversions)

// US limits are already numbers - use as-is
const occurrenceLimit = quoteData.rating.input.GL.occurrenceLimit; // ✓ already number
```

---

## 📐 Coverage Structures

### Canada GL (6 main + 1 optional)
```
1. General Aggregate
2. Each Occurrence
3. Product/Completed Operations Aggregate
4. Personal/Advertising Injury Liability
5. Medical Payments
6. Tenant Legal Liability
7. Pollution Extension (if limitedPollutionLiability === true)
```

### Canada Optional
```
- EO Coverage (if miscellaneousEO === true)
- Others Array: Unmanned Aircraft (if limitedCoverageForUnmannedAircraft === true)
```

### US Limits (4 fields)
```
1. occurrenceLimit
2. premisesRentedToYouLimit
3. medicalPaymentsLimit
4. aggregateLimit
```

---

## 🎨 Formatting

### Canada
```typescript
// Currency
new Intl.NumberFormat('en-CA', {
  currency: 'CAD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
})

// Date
formatStr: 'yyyy/MM/dd'

// Province
ON → Ontario (unabbreviate)

// Profession
['CODE1', 'CODE2'] → lookup display names → join with ', '
```

### US
```typescript
// Currency
formatCurrency(value, false) // with grouping: $1,234

// Date
formatStr: 'MM-dd-yyyy'

// Insured (multi-line string)
`${namedInsured}\n${street}\n${city}, ${province}, ${postalCode}`

// Profession
professionList.join(', ')
```

---

## 📄 PDF Generation

### Canada: HTML + Handlebars
```typescript
1. Compile Handlebars template
2. Register helpers: formatCurrency, formatDate, toLongProvinceName
3. Call html2pdf with Browserless token
4. Options: A4, margins 0.5in, printBackground: true
```

### US: ACORD 25 Form Fill
```typescript
1. Load acord_25_2016-03.pdf
2. Select form config: StateNational OR Munich (by carrierPartner)
3. Fill text fields: form.getTextField(name).setText(value)
4. Check checkboxes: form.getCheckBox(name).check()
5. Embed signature: form.getButton('US-Coi-signature').setImage(img)
6. Format dates as MM-dd-yyyy
7. Format currency with grouping
```

---

## 📧 Delivery (Same for Both)

### Email
```
From: EMAIL_SENDER
To: recipientEmail
BCC: [SUPPORT_EMAIL, EMAIL_BCC3]
Subject: "Foxquilt Insurance - Certificate of Insurance"
Attachment: certificate-of-insurance.pdf
```

### S3 Upload
```
Canada filename: ${policyFoxdenId}|${additionalInsuredName}|${timestamp}.pdf
US filename: ${policyNumber}|${certificateNumber}|${timestamp}.pdf
Bucket: COI_S3_BUCKETNAME
```

### Database
```
Collection: COIRecord
Version: 6
Fields: additionalInsured, policyFoxdenId, s3Response, carrierPartner
```

---

## 🔧 Assets to Copy

```bash
# Form configs
UScoiFormsConfigs-StateNational.json → src/config/forms/
UScoiFormsConfigs-Munich.json → src/config/forms/

# Signatures
StateNationalPresidentSignature.png → templates/signatures/
MunichUSSignature.png → templates/signatures/

# Templates
acord_25_2016-03.pdf → templates/acord25/
template.handlebars → templates/html/
emailBody.html → src/delivery/templates/coi-email-en.html
```

---

## 🚨 Gotchas

1. **Canada limits are strings** - MUST convert with `Number()`
2. **US dates from quote**, not policy - Check `quote.rating.input.GL`
3. **Different address fields** - Canada uses MailingAddress, US uses BusinessAddress
4. **Quote kind check** - Canada checks `=== 'Canada'`, US checks `!== 'Canada'`
5. **Insurance company hardcoded** - Canada: "Certain Underwriters at Lloyd's of London"
6. **Profession handling** - Canada converts array to lookup names, US joins as-is

---

## 📍 File Locations

### Old System
```
Canada: ~/Desktop/repos/foxden-policy-document-backend/src/services/certificateOfInsurance/
US: ~/Desktop/repos/foxden-policy-document-backend/src/services/UScertificateOfInsurance/
Helpers: ~/Desktop/repos/foxden-policy-document-backend/src/services/utils/
         ~/Desktop/repos/foxden-policy-document-backend/src/utils/
```

### New System
```
Data: src/data/services/, src/data/utils/
Extract: src/generator/extract/
Transform: src/generator/transform/
Load: src/generator/load/canada/, src/generator/load/acord25/
Config: src/config/forms/
```

---

## ✅ Story Breakdown

| Story | Focus | Items |
|-------|-------|-------|
| **0** | TypeScript setup, folder structure, assets | 30 items |
| **1** | Port 7 helper functions, extract 18 fields | 35 items |
| **2** | Transform layer, PDF generation | 25 items |
| **3** | Configuration management | 10 items |
| **4** | Email & delivery | 15 items |

---

## 📚 Full Documentation

- **Coverage Matrix:** `docs/COVERAGE_MATRIX.md` - Detailed checklist
- **Coverage Analysis:** `docs/COVERAGE_ANALYSIS.md` - Line-by-line analysis
- **Execution Plan:** `docs/STORY0_EXECUTION_PLAN.md` - Step-by-step guide

---

**Version:** 1.0 | **Date:** 2026-02-09
