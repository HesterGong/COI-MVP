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
  - Canada COI: `src/services/certificateOfInsurance/sendCertificateOfInsurance.ts`
  - US COI: `src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts`
  - Helpers: `src/services/utils/`, `src/utils/`

- **New System (Implementation Target):** `/home/hestergong/Downloads/coi-mvp-etl/`
  - Current MVP with fixtures (to be replaced)
  - Uses TypeScript, ETL pipeline architecture

---

## Story Progress

### ✅ Story 1: Data Layer & MongoDB Integration - COMPLETED
**Status:** Implementation guide created
**File:** `docs/story1-implementation.md`
**What was done:**
- Created TypeScript setup instructions
- Defined all data layer files to create
- Ported 6 core functions from old system
- Fixed certificate number concurrency bug
- Updated extract layer to use real MongoDB

### 🔄 Story 2: Transform Layer Enhancement - CURRENT
**Status:** Ready to implement
**File:** `docs/story2-implementation.md` (TO BE CREATED BY YOU)

### 📋 Stories 3-10: Remaining
**Status:** Defined in epic, awaiting implementation guides

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

### DO ✅
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

### DON'T ❌
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

## Story 2 Specific Instructions

### What Story 2 Is About
Transform extracted data (from Story 1) into canonical format for PDF generation.

### Where to Find Transform Logic in Old System

**Canada Transformation:**
- File: `~/Desktop/repos/foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts`
- Lines: 90-209
- What it does:
  - Converts string numbers to actual numbers (Canada sends as strings)
  - Builds GL coverage structure with deductibles
  - Conditionally builds EO coverage
  - Builds "others" array for optional coverages
  - Generates named insured

**US Transformation:**
- File: `~/Desktop/repos/foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts`
- Lines: 107-122
- What it does:
  - Builds insured block as multi-line string: `"Name\nStreet\nCity, State, Zip"`
  - Joins profession list with commas
  - Creates flat UsCoiInput structure

**Canada HTML Generation Helpers:**
- File: `~/Desktop/repos/foxden-policy-document-backend/src/services/certificateOfInsurance/generate.ts`
- Lines: 86-117
- What it does:
  - Converts profession codes to names (`getProfessionNameList`)
  - Format currency for Canada (`formatCurrency`)
  - Convert province abbreviation to full name (`toLongProvinceName`)

### What Needs to Be Updated in New System

**Current File:** `/home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transform.mjs`
- Currently too generic
- Doesn't handle Canada string-to-number conversion
- Doesn't build Canada GL coverage structure properly
- Doesn't handle Canada EO coverage
- Doesn't handle Canada optional coverages array
- Doesn't format US insured block correctly

**What You Need to Do:**
1. Read current `transform.mjs` to understand structure
2. Analyze transformation logic in both old system files above
3. Create `docs/story2-implementation.md` showing:
   - What to port from Canada transformation
   - What to port from US transformation
   - How to handle both geographies in same transform layer
   - Complete code examples for new `transform.ts` file

---

## For Future Stories (3-10)

Follow the same pattern:
1. Read story in epic
2. Analyze relevant code in old system
3. Create detailed implementation guide
4. Implement following the guide

**Story 3: Configuration** - Port form configs, carrier configs
**Story 4: Persistence** - S3 upload, COIRecord database writes (uses Story 1 helpers)
**Story 5: Email** - Email delivery service
**Story 6: API/Events** - Lambda handler, event interface
**Story 7: Signatures** - Copy signature images, carrier-based selection
**Story 8: Testing** - Comprehensive test suite
**Story 9: Deployment** - Infrastructure, monitoring
**Story 10: Production Readiness** - Final checks, documentation

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
- ✅ New system produces **same output** as old system
- ✅ All functions from old system are **ported, not rewritten**
- ✅ **TypeScript** is used throughout
- ✅ Code is **integrated into ETL pipeline**
- ✅ **Tests pass** comparing old vs new output
- ✅ **Implementation guide exists** for your story

---

## Example: How Story 1 Was Completed

### What Was Done
1. ✅ Read Story 1 in epic
2. ✅ Analyzed old system extraction code
3. ✅ Created `docs/story1-implementation.md` with:
   - Complete TypeScript setup
   - All 6 functions to port with exact sources
   - Updated extract.ts with extraction logic
   - Integration with index.ts
4. ✅ Updated epic Story 1 to be concise and reference implementation guide

### Result
- Epic story: Brief, clear scope, references implementation guide
- Implementation guide: Detailed, complete code, ready to implement
- Next person can follow guide step-by-step

---

## Now: Work on Story 2

**Your Task:**
1. Read Story 2 in `COI_MIGRATION_EPIC.md`
2. Analyze transformation logic in old system:
   - `sendCertificateOfInsurance.ts:90-209`
   - `sendUsCertificateOfInsurance.ts:107-122`
   - `generate.ts:86-117`
3. Create `docs/story2-implementation.md` following the template above
4. Update Story 2 in epic to be concise (like Story 1)

**Start Here:**
```bash
# Read the current transform logic
cat /home/hestergong/Downloads/coi-mvp-etl/src/generator/transform/transform.mjs

# Read the old system Canada transformation
cat ~/Desktop/repos/foxden-policy-document-backend/src/services/certificateOfInsurance/sendCertificateOfInsurance.ts | sed -n '90,209p'

# Read the old system US transformation
cat ~/Desktop/repos/foxden-policy-document-backend/src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts | sed -n '107,122p'
```

Good luck! Remember: **Port, don't reinvent.** 🚀
