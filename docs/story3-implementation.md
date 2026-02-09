# Story 3: Configuration Management – Implementation Guide

**Story ID:** COI-3
**Priority:** High
**Story Points:** 5
**Phase:** 3 - Configuration
**Epic:** COI-2024

## Description

Centralize and formalize configuration management to enable adding new geographies, lines of business (LOBs), and carriers without code changes. Port proven configuration values and rules from the old system into TypeScript-based, strictly-typed config modules with validation.

This guide defines the directory structure, TypeScript interfaces, validation, loader strategy, and integration points. It also includes concrete extensibility examples (UK, Australia, BOP, Lloyd's) and ports exact values from the old system (US ACORD 25 form configs, Canada formats, carrier signatures, and insurer name).

---

## Scope

- Create `src/config/` directory and config files for forms, carriers, mappings, and professions
- TypeScript with `strict: true` for all config modules
- Add JSON Schema or Type-driven validation and a central `ConfigLoader`
- Reference the config from Transform, Map, and Load layers
- Port existing production values:
  - US ACORD 25 form field mapping (Munich, StateNational)
  - Canada HTML currency/date helpers and province resolver patterns
  - Signature assets for Munich and StateNational
  - Insurer name: "Certain Underwriters at Lloyd's of London"

---

## Directory Structure

Plan a single TypeScript config file with strict typing (docs-only stage):

```
/home/hestergong/Downloads/coi-mvp-etl/
└── src/
  └── config/
    └── config.ts   ← Single source of truth (forms, carriers, mappings, professions, validation)
```

Notes:
- The existing US ACORD 25 JSON files remain in `src/generator/config/form-configs/` and are imported into `config.ts`.
- Signature assets already exist in `templates/signatures/` with exact filenames used in production.

---

## TypeScript Interfaces (Strict Typing)

Design for `src/config/config.ts`: it will contain all interfaces and concrete config in one place and will export `configRoot`, `validateConfig()`, and `getConfig()` when implemented. This guide documents the structure before code changes.

---

## Ported Values from Old System (Exact)

- US ACORD 25 form configs: Use the exact JSON structures already present in [src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json](coi-mvp-etl/src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json) and [src/generator/config/form-configs/UScoiFormsConfigs-Munich.json](coi-mvp-etl/src/generator/config/form-configs/UScoiFormsConfigs-Munich.json). These match production fields used in:
  - [foxden-policy-document-backend/src/services/UScertificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/generate.ts)
  - Carrier selection logic uses `carrierPartner` to switch between StateNational and Munich.
- Canada HTML helper defaults:
  - Currency: `CAD`, locale: `en-CA`, date format: `yyyy/MM/dd`
  - Province name resolver via `toLongProvinceName` in Handlebars helpers
  - Source: [foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts)
- Insurer display name for Canada: "Certain Underwriters at Lloyd's of London" from the COI input builder in:
  - [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
- Signature assets:
  - Munich: [templates/signatures/MunichUSSignature.png](coi-mvp-etl/templates/signatures/MunichUSSignature.png)
  - StateNational: [templates/signatures/StateNationalPresidentSignature.png](coi-mvp-etl/templates/signatures/StateNationalPresidentSignature.png)

---

## Concrete Configuration Data

Planned content of `src/config/config.ts` (to be implemented), derived from old system:
- **US ACORD 25 forms:** Import exact JSONs used by US generator:
  - [src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json](coi-mvp-etl/src/generator/config/form-configs/UScoiFormsConfigs-StateNational.json)
  - [src/generator/config/form-configs/UScoiFormsConfigs-Munich.json](coi-mvp-etl/src/generator/config/form-configs/UScoiFormsConfigs-Munich.json)
  - Selection rules mirror `carrierPartner` logic in [foxden-policy-document-backend/src/services/UScertificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/generate.ts).
- **Templates:**
  - US ACORD 25 PDF path: [templates/acord25/acord_25_2016-03.pdf](coi-mvp-etl/templates/acord25/acord_25_2016-03.pdf) (used as base in US generator).
  - Canada HTML template: [templates/html/template.handlebars](coi-mvp-etl/templates/html/template.handlebars) consumed by [foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts).
- **Carrier metadata:**
  - Signature paths match US generator: [MunichUSSignature.png](templates/signatures/MunichUSSignature.png), [StateNationalPresidentSignature.png](templates/signatures/StateNationalPresidentSignature.png).
  - Insurer display name for Canada: “Certain Underwriters at Lloyd’s of London” (from [Canada send](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts#L150-L210)).
- **Field mappings:**
  - CA GL/EO inputs (string→number) for coverage building (from [foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)).
  - US GL flat limits and insured block formatting (from [foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)).
  - Include BOP example for future extensibility.
- **Profession mapper:**
  - CSV path: [foxden-policy-document-backend/src/services/policyDocument/munich/tables/profession_mapper.csv](foxden-policy-document-backend/src/services/policyDocument/munich/tables/profession_mapper.csv), used by Canada HTML via `getProfessionNameList`.
- **Defaults:**
  - US producer contact defaults (`usEmail`, `usPhoneNumber`) surfaced via config to align with ACORD forms; kept consistent with old system usage.

---

## Validation & Loader

Planned validation & loader in `src/config/config.ts`:
- Validates presence of US ACORD 25 template path, ACORD 25 form arrays, carrier signature paths, and profession CSV path.
- Future-ready hot-reload: watch the file, re-import, re-validate, and swap in memory.

---

## Integration Points

- Transform layer (Story 2): consumes `mappingConfig` and geography/LOB metadata
- Map layer: uses `formConfig` to select template types (US ACORD 25 vs Canada HTML) and field maps
- Load layer: uses `carrierConfig` for signature selection and carrier metadata
- Profession lookup: `professionMapperConfig` drives CSV loading for name conversions

---

## Extensibility Examples

- Add UK Geography:
  - Add `UK` block in `formConfig.geographies` (see example above)
  - Add `LLOYDS` carrier or any UK carrier to `carrierConfig`
  - Add `UKGLTransformer` in mapping for `GL` as needed
- Add Australia:
  - Add `AU` with `en-AU`, `AUD`, and templates in `formConfig`
  - Add mapping entries under `mappingConfig.maps`
- Add BOP LOB:
  - Add `BOP` under `LOBCode`, add mapping entry for US
  - No code changes in transformers if using config-driven selection
- Add Lloyd's Carrier:
  - Already shown; includes address and contact metadata, signature path, and insurer display name
  - Canada insurer display name continues to be configurable (not hardcoded)

---

## Steps to Implement

1. Draft and review `src/config/config.ts` design (this document).
2. Import US ACORD 25 JSON files from `src/generator/config/form-configs/`.
3. Port carrier metadata and signatures; include Lloyd’s insurer display name.
4. Add mapping entries for CA GL/EO and US GL; include BOP example.
5. Implement `validateConfig()` and `getConfig()`.
6. Wire Transform/Map/Load layers to consume `getConfig()`.
7. Optional: add admin endpoints for `GET /api/config` and `POST /api/config/reload`.

---

## Acceptance Criteria

- Configuration lives under `src/config/` with strict TypeScript interfaces
- Adding UK/AU/BOP/Lloyd's is a config-only change; no code changes required
- US ACORD 25 (Munich/StateNational) forms load from config
- Carrier signatures resolve via `carrierConfig` and match assets
- Canada helpers (CAD currency, `yyyy/MM/dd`, province resolver) documented and configurable
- Validation fails fast on startup; loader exposes `validateAll()` and a plan for hot-reload
- Documentation contains concrete examples and ports exact values listed above

---

## Yarn Commands

```bash
# Install dependencies (TypeScript, if needed for config modules)
yarn install

# Build when TypeScript is added
yarn build

# (Optional) Run dev once wired into pipeline
yarn dev
```
