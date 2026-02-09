# Instructions for AI Agent - COI Migration Epic

## Overview

You are working on migrating COI (Certificate of Insurance) generation from the old system (foxden-policy-document-backend) to the new system (coi-mvp-etl). This is a **porting project**, not a greenfield implementation.

**Key Principle:** REUSE proven code from the old system. Copy and adapt, don't rewrite from scratch.

---

## Project Structure

### Epic & Stories Location
- **Main Epic:** `/home/hestergong/Downloads/coi-mvp-etl/COI_MIGRATION_EPIC.md`
  - Contains all story definitions (concise, suitable for Jira)
  - Each story has brief acceptance criteria

### Implementation Guides
- **Detailed Implementation:** `/home/hestergong/Downloads/coi-mvp-etl/docs/story{N}-implementation.md`
  - Contains specific file paths, code examples, integration steps
  - Use these as your primary reference when implementing

### Current Codebase Locations
- **Old System (Reference - DO NOT MODIFY):** `~/Desktop/repos/foxden-policy-document-backend/`
  - Canada COI: [src/services/certificateOfInsurance/sendCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts)
  - US COI: [src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts](foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts)
  - Key helpers and services:
    - [findPolicyHead](foxden-policy-document-backend/src/services/utils/findPolicyHead.ts)
    - [generateNamedInsured](foxden-policy-document-backend/src/utils/generateNamedInsured.ts)
    - [getPolicyIdByLineOfBusiness](foxden-policy-document-backend/src/services/utils/getPolicyIdByLineOfBusiness.ts)
    - [getLatestActivePolicy](foxden-policy-document-backend/src/services/utils/getLatestPolicy.ts)
    - [getCarrierFromPolicy](foxden-policy-document-backend/src/services/utils/saveInsuranceDocumentUtils.ts)
    - [getProfessionNameList](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionNameList.ts)
    - [getProfessionMapper](foxden-policy-document-backend/src/services/policyDocument/utils/getProfessionMapper.ts)

- **New System (Implementation Target):** `/home/hestergong/Downloads/coi-mvp-etl/`
  - Current MVP with fixtures (to be replaced)
  - Uses TypeScript, ETL pipeline architecture
  - Existing helpers for Canada HTML live in [src/generator/load/html/helpers.mjs](coi-mvp-etl/src/generator/load/html/helpers.mjs)

---

## How to Approach Each Story

### Step 1: Read the Story in the Epic
Start with `COI_MIGRATION_EPIC.md` - find your story and understand:
- Description
- Scope (what to remove, create, modify)
- Brief acceptance criteria

### Step 2: Analyze Current Implementation
Before creating implementation guide, analyze the old system:

1. **Find the relevant code:**
   ```bash
   # Search for functions/logic in old system
   grep -rn "function_name" ~/Desktop/repos/foxden-policy-document-backend/
   ```

2. **Understand the data flow:**
   - Where is data extracted?
   - How is it transformed?
   - What is the final output structure?

3. **Identify what to port:**
   - Which functions can be copied exactly?
   - Which need adaptation for TypeScript?
   - What bugs/issues exist in old code?

### Step 3: Create Implementation Guide
Create `docs/story{N}-implementation.md` with:

**Template Structure:**
```markdown
# Story {N}: {Title} - Implementation Guide

## Current System Analysis

### Where This Logic Lives
- File: [path in old system]
- Lines: X-Y
- Purpose: ...

### Key Functions to Port
1. **functionName** (lines X-Y)
   - What it does: ...
   - Where to copy it: `src/new/path/file.ts`
   - Changes needed: ...

## Implementation Steps

### Files to CREATE
- `src/path/to/new/file.ts` - Description
  ```typescript
  // Complete code example
  ```

### Files to MODIFY
- `src/path/to/existing/file.ts` - What to change
  - Remove: ...
  - Add: ...

### Files to DELETE
- `src/path/to/old/file.ts` - Why it's being removed

## Integration Points

### How It Connects to ETL Pipeline
```
[Previous Stage] → [This Story's Code] → [Next Stage]
```

### Dependencies on Other Stories
- Depends on: Story X (needs Y function)
- Used by: Story Z (provides A data)

## Testing Strategy

### Unit Tests
- Test function X
- Test function Y

### Integration Tests
- Test end-to-end flow
- Compare output with old system

## Code Examples

[Complete, runnable code examples for each file]
```

### Step 4: Implement Following the Guide
- Create files in exact locations specified
- Copy code from old system (with attribution comments)
- Convert TypeScript as needed
- Test as you go

---

## Critical Guidelines

### DO [DONE]
- **Use Yarn (not npm)** for package management
  - Run `yarn install` instead of `npm install`
  - Use `yarn add` instead of `npm install <package>`
  - Scripts: `yarn build`, `yarn start`, `yarn test`

- **Read both old system files referenced in each story**
  - `sendCertificateOfInsurance.ts` (Canada)
  - `sendUsCertificateOfInsurance.ts` (US)
  - Related helper files

- **Copy proven code from old system**
  - MongoDB aggregations: copy exactly
  - Business logic: port with minimal changes
  - Helper functions: copy entire functions

- **Use TypeScript in new system**
  - All new files should be `.ts`
  - Define proper interfaces
  - Use strict type checking

- **Maintain same behavior**
  - Same data structures
  - Same field names
  - Same output format

- **Create detailed implementation guides**
  - Include complete code examples
  - Show exact file paths
  - Document integration points

### DON'T [REMOVE]
- **Don't modify old system** (`~/Desktop/repos/foxden-policy-document-backend/`)
  - It's the reference implementation
  - Read-only access

- **Don't rewrite logic**
  - Port, don't reimplement
  - Keep same algorithms
  - Only fix known bugs

- **Don't change data structures**
  - Maintain compatibility
  - Same field names as old system
  - Same nested structures

- **Don't skip implementation guides**
  - Stories should be brief
  - Details go in `docs/story{N}-implementation.md`

---

## Getting Help

### If You're Stuck
1. Re-read the old system code carefully
2. Check if there's a similar pattern in already-implemented stories
3. Look at Story 1 implementation guide as an example
4. Remember: port, don't reinvent

### Common Questions

**Q: Should I use TypeScript or JavaScript?**
A: TypeScript. All new files should be `.ts`

**Q: The old code has a bug, should I fix it?**
A: Only if it's a known bug documented in the story (like certificate number concurrency). Otherwise, port as-is to maintain behavior.

**Q: Old code uses different patterns than new code. Which to follow?**
A: Adapt old code to new architecture (ETL pipeline) but keep the business logic identical.

**Q: Should I create one big file or split into multiple?**
A: Follow the new system's architecture (separate extract, transform, map, load). Split old monolithic code across appropriate stages.

---

## Success Criteria

Your implementation is successful when:
- New system produces **same output** as old system
- All functions from old system are **ported, not rewritten**
- **TypeScript** is used throughout
- Code is **integrated into ETL pipeline**
- **Tests pass** comparing old vs new output
- **Implementation guide exists** for your story

---
