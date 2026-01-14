# COI MVP

This repo is a small, self-contained MVP that generates Certificates of Insurance (COI) using an explicit, config-driven ETL pipeline.

Goals

- Make the pipeline boundaries explicit (extract → transform → map → load)
- Keep per-LOB / per-geography behavior in configuration and pluggable renderers
- Allow adding new LOBs, geographies, and templates with minimal code changes

Supported renderers

- US: ACORD 25 PDF form-fill (pdf-lib)
- CA: Handlebars HTML → PDF (Browserless)

## Quickstart

Prereqs

- Node.js 18+ (Node 20 recommended)
- Yarn (optional). This repo includes Yarn PnP artifacts (.pnp.cjs). You can run with npm, but Yarn is the “native” setup here.

Install

```bash
yarn install
# or: npm install
````

Run

```bash
yarn start
# or: npm run start
```

Outputs are written to:

* `./out/COI_<applicationId>_<lob>.pdf`

The default demo run (see `src/index.mjs`) publishes:

* US request: LOB = E&O
* CA request: LOB = GL

## High-level flow

`src/index.mjs` creates an in-memory event bus and subscribes to `COIRequested`.
When a COI is requested, it:

1. Iterates requested LOBs
2. Calls `generateCOI(...)` per LOB
3. Each invocation generates exactly one COI PDF
4. Output is written independently per LOB

ASCII view

```
COIRequested
   |
   v
for each LOB
   |
   v
generateCOI
   |
   v
runPipeline (ETL)
   |
   v
PDF bytes (per LOB)
   |
   v
write output -> out/COI_<applicationId>_<lob>.pdf
```

## Folder structure

```
src/
  index.mjs                 # demo publisher + bus subscriber
  bus.mjs                   # simple in-memory event bus
  types.mjs                 # event constructors + randomId()
  fixtures.mjs              # MVP data store (pretend “Mongo collections”)
  generator/
    generateCOI.mjs         # per-LOB entrypoint
    config/
      loadConfig.mjs
      coiConfig.local.mjs   # config matrix (LOB + geography + carrier → template + mappings)
      form-configs/
        UScoiFormsConfigs-StateNational.json
        UScoiFormsConfigs-Munich.json
    pipeline/
      runPipeline.mjs       # extract → transform → map → load
    extract/
      extract.mjs           # MVP extract: read from fixtures.mjs
    transform/
      transform.mjs         # canonical COI model builder
    map/
      mapData.mjs           # lodash.get mapping helper
    load/
      loadPdf.mjs           # chooses the renderer (US PDF vs CA HTML)
      acord25/pdfGenerator.mjs
      html/htmlGenerator.mjs
      html/helpers.mjs
      utils/html2pdf.mjs
templates/
  acord25/acord_25_2016-03.pdf
  html/template.handlebars
  signatures/               # signature images (not automatically used by US generator today)
out/
  *.pdf                     # generated outputs
```

## The ETL pipeline in detail

The pipeline is implemented in `src/generator/pipeline/runPipeline.mjs`:

### 1) Extract

`src/generator/extract/extract.mjs` loads:

* `policy` from a “collection” (MVP: `src/fixtures.mjs`)
* `coverages` by LOB

Production note: this is where you would read MongoDB based on `config.dbCollection`.

### 2) Transform

`src/generator/transform/transform.mjs` normalizes raw policy/quote shapes into a canonical model:

* insured name/address (+ formatted “block” string for US PDF)
* certificate holder / additional insured
* producer info
* dates (effective/expiration)
* limits (occurrence, aggregate, etc.)
* a fallback `coverageSummary` string for descriptions

This step is intentionally renderer-agnostic: no PDF field names or Handlebars logic should be here.

### 3) Map

`src/generator/map/mapData.mjs` maps from:

```
ctx = { canonical, lob, geography, carrierPartner, timeZone }
```

into the renderer input object using `fieldMappings` from the COI config.

Example (US):

* `insured: canonical.insured.block`
* `policyNumber: canonical.policyNumber`
* `effectiveDate: canonical.dates.effectiveDate`

Example (CA):

* `namedInsured: canonical.insured`
* `additionalInsured: canonical.additionalInsured`
* `coverages: canonical.coverages`

### 4) Load (render)

`src/generator/load/loadPdf.mjs` selects a renderer based on `config.templateType`:

* `acord25` → `UsAcordCoiGenerator` (pdf-lib form-fill)
* `html-handlebars` → `renderCanadaHtml` (Handlebars → Browserless PDF)

## Configuration: COI_CONFIGS

All per-LOB/per-geography wiring is in:

* `src/generator/config/coiConfig.local.mjs`

Each entry defines:

* `lob`, `geography`, `carrierPartner`
* `dbCollection` (where extract should look)
* `templateType`
* `templatePath`
* optional `formsConfigPath` (US only)
* `fieldMappings` (canonical → renderer input)
* optional `transforms` (advanced hook for future)

When `generateCOI` runs, it calls `loadConfig()` which uses `findConfig()`:
it prefers an exact match (lob + geography + carrierPartner) and can fall back to a default (lob + geography).

## US renderer notes (ACORD 25)

US rendering is implemented in `src/generator/load/acord25/pdfGenerator.mjs`.

How it works

* Loads the template PDF from `config.templatePath` (currently `./templates/acord25/...pdf`)
* Loads a forms config JSON file from `config.formsConfigPath`
* For each configured field:

  * reads `input[formVariable]`
  * formats dates (`MM-dd-yyyy`)
  * formats numbers as USD currency by default
  * sets PDF text fields / checkboxes

Debugging PDF fields

The generator prints the PDF field list every run via `debugListPdfFields(form)`.
This is useful when the PDF template changes.

Common mismatch: missing field in template PDF

If `strict` mode is enabled (default), it will throw:

`[US ACORD] Missing field in template PDF: <fieldName>`

Fix by either:

* updating the template PDF to include the expected field name, or
* updating the JSON forms config to match the PDF field names

Signature and certificate holder blocks

* The US generator tries to set:

  * `US-Coi-signature` (button field) using a local PNG
  * `US-Coi-certificateHolder` (text field) as a multi-line block

Important: the code currently looks for the signature at:

* `assets/signatures/signature.png`

But this repo stores example signatures at:

* `templates/signatures/*`

If you want the signature to render, either:

* create `assets/signatures/signature.png` (copy from `templates/signatures/signature.png`), or
* update the generator to point at `templates/signatures/signature.png`

## CA renderer notes (Handlebars → Browserless)

CA rendering is implemented in:

* `src/generator/load/html/htmlGenerator.mjs`
* `src/generator/load/utils/html2pdf.mjs`

How it works

1. loads `templates/html/template.handlebars`
2. registers helpers:

   * `formatCurrency` (CAD)
   * `formatDate` (yyyy/MM/dd, timezone-aware)
   * `toLongProvinceName` (ON → Ontario, etc.)
3. compiles HTML with data fields
4. calls Browserless: `https://chrome.browserless.io/pdf?token=...`

Environment variables

Set one of these:

* `BROWSERLESS_API_TOKEN` (preferred)
* `BROWSERLESS_TOKEN` (legacy fallback)

Example

```bash
export BROWSERLESS_API_TOKEN="your-token-here"
yarn start
```

Security note: `src/generator/load/loadPdf.mjs` currently has a hard-coded fallback token.
Do not use hard-coded tokens in production; replace this with environment-only configuration.

## Adding a new LOB or geography

1. Add fixtures (MVP only)

* Add a policy fixture to `src/fixtures.mjs` under the correct `dbCollection`
* Add coverages in `fixtures.coveragesByLob`

2. Add a COI config entry

In `src/generator/config/coiConfig.local.mjs`, add a new object with:

* lob/geography/carrierPartner
* dbCollection
* templateType + templatePath
* fieldMappings

3. Add or reuse a renderer

* If the new output format is still ACORD 25, reuse `acord25`
* If you need a different PDF template, point `templatePath` to it
* If you need a new rendering strategy, add a new templateType and implement it in `loadPdf.mjs`

## Common issues

“ENOENT: no such file or directory … acord_25_2016-03.pdf”

* Ensure the PDF exists at `templates/acord25/acord_25_2016-03.pdf`
* Ensure you are running from repo root (so relative paths resolve correctly)

Browserless PDF failed: 401 / 403

* Your token is missing or invalid
* Set `BROWSERLESS_API_TOKEN` in your environment

PDF text looks blank in some viewers

* The US renderer calls `form.updateFieldAppearances(font)` to improve compatibility.
  If you add new fields or fonts, ensure appearances are updated.

---

## TODO / Known Limitations (MVP)

### Multi-LOB orchestration is intentionally outside COI generation

Current behavior:

* COI generation is strictly **per LOB**
* Each `generateCOI(...)` invocation produces **one immutable PDF**
* Fan-out (multiple LOBs) happens in the caller / orchestrator
* This repo’s `index.mjs` simulates that orchestration for demo purposes only

Future work (outside this repo’s scope):

* Orchestrate COI fan-out via EventBridge / controller service
* Upload PDFs to S3 and notify/email downstream
* Add workflow-level aggregation only if required by delivery channels

---

## Productionization checklist

* Replace `src/fixtures.mjs` with MongoDB extract logic (keep the extract boundary)
* Move configuration to a real config store (S3 / DB / repo config)
* Replace Browserless token fallback with secrets management
* Replace the “in-memory bus” with your real event system (SNS/SQS/EventBridge)
* Write outputs to S3 and notify/email instead of writing to `./out`
* Add structured logging and tracing ({ applicationId, lob }, geography, carrierPartner, policyFoxdenId)
* Add tests for:

  * canonical builder (transform step)
  * mapping correctness (map step)
  * renderer integration (golden PDF snapshot or field-level assertions)

