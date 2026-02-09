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
- `package.json` scripts updated
- `.env.example` created; environment variables documented
- Temporary adapters used where needed to avoid breaking changes

## Final Project Structure (target)

```
coi-mvp-etl/
  src/
    api/                  # Story 5+ (placeholder)
    config/               # Story 3 consolidated config
      forms/              # US ACORD JSON
      carriers.ts
      mappings.ts
      types.ts
      index.ts
    data/                 # Story 1
      client/MongoDbClient.ts
      services/
        PolicyDataExtractor.ts
        CertificateNumberService.ts
        ProfessionLookupService.ts
        PolicyMetadataService.ts
        CarrierInfoService.ts
      utils/
        generateNamedInsured.ts
        getPolicyIdByLineOfBusiness.ts
        address/isAddressType.ts
      types/PolicyView.ts
    generator/
      extract/extract.ts
      transform/transform.ts
      transform/types.ts
      map/map.ts
      load/
        canada/
          htmlGenerator.ts
          helpers.ts
        acord25/
          pdfGenerator.ts
        utils/
          formatters.ts
      pipeline/runPipeline.ts
      generateCOI.ts
    delivery/             # Story 4+ (placeholder)
      EmailService.ts
      DeliveryOrchestrator.ts
      templates/
        coi-email-en.html
    templates/
      acord25/
      html/
        template.handlebars
      signatures/
    index.ts
    types.ts
  docs/
    AI_AGENT_INSTRUCTIONS.md
    story0-implementation.md
    story1-implementation.md
    story2-implementation.md
    story3-implementation.md
  tsconfig.json
  jest.config.ts
  .eslintrc.cjs
  .prettierrc
  .env.example
```

## Refactor Mapping (old → new)

- `src/index.mjs` → `src/index.ts`
- `src/types.mjs` → `src/types.ts`
- `src/fixtures.mjs`` and `src/generator/extract/fixtures.mjs` → removed (Story 1 supplies real data)
- `src/generator/extract/extract.mjs` → `src/generator/extract/extract.ts`
- `src/generator/transform/transform.mjs` → `src/generator/transform/transform.ts`
- `src/generator/map/map.mjs` → `src/generator/map/map.ts`
- `src/generator/load/html/helpers.mjs` → `src/generator/load/canada/helpers.ts`
- `src/generator/load/acord25/pdfGenerator.mjs` → `src/generator/load/acord25/pdfGenerator.ts`
- `src/generator/pipeline/runPipeline.mjs` → `src/generator/pipeline/runPipeline.ts`
- `src/generator/config/form-configs/*` → `src/config/forms/*` (moved)

MVP Note: These moves are planned; no code changes are applied yet. The mapping provides a clear path once execution begins.

## Implementation Steps

### 1) Tooling & TypeScript
- Add `tsconfig.json` with `strict: true`, `moduleResolution: NodeNext`, `target/module: ES2022`, `esModuleInterop`, `resolveJsonModule`.
- Add `.eslintrc.cjs` (TypeScript + ESM rules) and `.prettierrc`.
- Add `jest.config.ts` with `ts-jest` preset and ESM support.

### 2) Scripts & Environment
- Update `package.json` scripts: `build`, `dev`, `test`, `lint`, `format`.
- Create `.env.example` with `MONGODB_URI`, email-related vars (`EMAIL_SENDER`, `SUPPORT_EMAIL`, `EMAIL_BCC3`), and placeholders.

### 3) File Moves & Adapters
- Convert `.mjs` to `.ts` and move to the target folders.
- If imports break, add temporary re-export shims (e.g., export from new path) to keep current flow compiling.

### 4) Non-breaking Validation
- Run quick smoke tests to confirm generation still runs with fixtures.
- Defer data-layer replacement to Story 1; do not remove working paths until new layer is wired.

## Verification Checklist

- [ ] `yarn build` compiles with TypeScript, no type errors
- [ ] `yarn test` runs (even if minimal)
- [ ] `yarn lint` passes or produces only warnings agreed for migration
- [ ] Loading Canada HTML still works with moved helpers
- [ ] US ACORD PDF generator still accessible at its new path
- [ ] No runtime import errors after refactor
- [ ] Docs updated (AI instructions, Story 2/3 paths)

## Commands

```bash
# Install TS/Jest/ESLint/Prettier and types
yarn add -D typescript ts-node @types/node ts-jest jest eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin prettier

# Initialize TS
npx tsc --init

# Build
yarn build

# Lint & format
yarn lint
yarn format

# Test
yarn test
```

## Rollback Plan

- Keep a refactor branch; if issues arise, revert to prior SHA and re-apply changes incrementally.
- Maintain adapter shims until Story 1 fully replaces fixtures and old paths.
