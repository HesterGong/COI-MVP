# coi-service

## Architecture

```
COIRequested Event
    │  { policyFoxdenId, geography, additionalInsured }
    ▼
handler() [src/index.ts]
    │  MongoDBConnection from @foxden/shared-lib
    │
    ▼  EXTRACT (once for all LOBs)
extract() → findPolicyHead() → RawPolicyData
    │  discovers LOBs from policyData.policies
    │
    ▼  per LOB
generateCOI() → loadConfig()
    │
    ▼  runPipeline()
    ├─► TRANSFORM → buildCanonical()  (CA or US path)
    ├─► MAP       → mapData()         (canonical → renderer fields)
    └─► LOAD      → loadPdf()
                        ├─► CA:  Handlebars → Browserless → PDF
                        └─► US:  ACORD 25 pdf-lib form-fill
                             │
                             └─► sendEmail()  (@foxden/shared-lib createTransport)
```

**CA path:** One combined PDF per `policyFoxdenId` (GL + optional EO in a single Handlebars document).

**US path:** One ACORD 25 PDF per LOB (`GL`, `EO` separately), form-filled via `pdf-lib`.

---

## Event Input

Mirrors the admin portal's `sendCOI` mutation:

```ts
interface COIRequested {
  policyFoxdenId: string;
  geography: 'US' | 'CA';
  additionalInsured: {
    name: string;       // Certificate Holder name
    address: {
      street: string;
      city: string;
      province: string; // state abbrev for US (e.g. 'NC'), province abbrev for CA (e.g. 'ON')
      postalCode: string;
    };
  };
}
```

Everything else (`lobs`, `carrierPartner`, `timeZone`, `recipientEmail`) is derived from the policy during extract.

---

## Supported Configurations

| LOB | Geography | Carrier | Renderer |
|-----|-----------|---------|----------|
| GL | CA | Foxquilt | Handlebars → Browserless |
| GL | CA | Greenlight | Handlebars → Browserless |
| GL | US | StateNational | ACORD 25 (pdf-lib) |
| EO | US | StateNational | ACORD 25 (pdf-lib) |
| GL | US | Munich | ACORD 25 (pdf-lib) |
| EO | US | Munich | ACORD 25 (pdf-lib) |

---

## Local Development

### Prerequisites

- Node 22 (`nvm use 22`)
- AWS credentials with access to `ca-central-1` (for SSM pool settings + Secrets Manager)

### Setup

```bash
npm install
cp .env.example .env   # then fill in values
```

### Key `.env` variables

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | Dev Atlas connection string (fetch from AWS Secrets Manager: `dev/foxden-policydocument`) |
| `STAGE` | `local` or `dev` → Ethereal email; `prod` → AWS SES |
| `BROWSERLESS_API_TOKEN` | Required for CA HTML→PDF rendering |
| `TEST_POLICY_ID` | `policyFoxdenId` to use when running `npm run dev` |
| `TEST_GEOGRAPHY` | `CA` or `US` |
| `TEST_AI_*` | Certificate Holder fields (mirrors admin portal form inputs) |

To get `MONGODB_URI` from AWS Secrets Manager:
```bash
aws secretsmanager get-secret-value \
  --secret-id "dev/foxden-policydocument" \
  --region ca-central-1 \
  --query SecretString --output text \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['MONGO_URL'])"
```

### Run

```bash
npm run dev       # ts-node with dotenv, reads TEST_* vars from .env
npm run typecheck # tsc --noEmit
npm run build     # compile to dist/
```

### Email in dev mode

With `STAGE=local` or `STAGE=dev`, emails are sent to [Ethereal](https://ethereal.email/) (a test SMTP sink — not delivered to the real recipient). The preview URL is logged:

```
sendEmail [test]: Ethereal preview (not delivered to recipient) {
  previewUrl: 'https://ethereal.email/message/...',
  ...
}
```

Open the URL to inspect the rendered email and download the attached PDF.

---

## Source Mapping

| File | Ported from |
|------|-------------|
| `src/generator/extract/findPolicyHead.ts` | `foxden-policy-document-backend: services/utils/findPolicyHead.ts` |
| `src/generator/transform/transformCA.ts` | `foxden-policy-document-backend: services/certificateOfInsurance/sendCertificateOfInsurance.ts` |
| `src/generator/transform/transformUS.ts` | `foxden-policy-document-backend: services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts` |
| `src/generator/load/acord25/pdfGenerator.ts` | `foxden-policy-document-backend: services/UScertificateOfInsurance/generate.ts` |
| `src/generator/load/html/htmlGenerator.ts` | `foxden-policy-document-backend: services/certificateOfInsurance/generate.ts` |
| `src/generator/load/email/sendEmail.ts` | Both backend `generate.ts` files |
| `src/generator/map/mapData.ts` | `coi-mvp-etl: src/generator/map/mapData.mjs` |
| `src/generator/pipeline/runPipeline.ts` | `coi-mvp-etl: src/generator/pipeline/runPipeline.mjs` |
| `src/generator/config/coiConfig.ts` | `coi-mvp-etl: src/generator/config/coiConfig.local.mjs` (extended) |
