# COI Migration Project - AI Agent Guide

## Quick Start for AI Agents

You're working on migrating COI generation from the old system to this new system.

### 📋 Read These First (In Order):

1. **[docs/AI_AGENT_INSTRUCTIONS.md](./docs/AI_AGENT_INSTRUCTIONS.md)** ← **START HERE**
   - Complete guide on how to approach stories
   - Where to find old system code
   - Guidelines and best practices

2. **[COI_MIGRATION_EPIC.md](./COI_MIGRATION_EPIC.md)**
   - Contains all story definitions (concise, for Jira)
   - Story 1: ✅ COMPLETED (implementation guide exists)
   - Story 2-10: 🔄 TO BE IMPLEMENTED

3. **Implementation Guides:**
   - `docs/story1-implementation.md` - ✅ Complete (Data Layer)
   - `docs/story2-implementation.md` - ❌ TO BE CREATED BY YOU (Transform Layer)
   - `docs/story{N}-implementation.md` - Create as you work on each story

---

## Your Task

**Current Story:** Story 2 - Transform Layer Enhancement

**What to Do:**
1. Read [docs/AI_AGENT_INSTRUCTIONS.md](./docs/AI_AGENT_INSTRUCTIONS.md) - Contains Story 2 specific instructions
2. Analyze transformation logic in old system (paths provided in instructions)
3. Create `docs/story2-implementation.md` with detailed implementation guide
4. Update Story 2 in epic to be concise (like Story 1)

---

## Project Architecture

```
Old System (Reference - Read Only)
  ~/Desktop/repos/foxden-policy-document-backend/
  ├── src/services/certificateOfInsurance/sendCertificateOfInsurance.ts  (Canada)
  └── src/services/UScertificateOfInsurance/sendUsCertificateOfInsurance.ts  (US)

New System (Implementation Target)
  /home/hestergong/Downloads/coi-mvp-etl/
  ├── src/
  │   ├── data/         ← Story 1 (✅ COMPLETED)
  │   ├── generator/
  │   │   ├── extract/  ← Story 1 (✅ COMPLETED)
  │   │   ├── transform/ ← Story 2 (🔄 CURRENT TASK)
  │   │   ├── map/
  │   │   └── load/
  │   └── index.ts
  ├── docs/
  │   ├── AI_AGENT_INSTRUCTIONS.md  ← READ THIS
  │   ├── story1-implementation.md  ← Reference example
  │   └── story2-implementation.md  ← CREATE THIS
  └── COI_MIGRATION_EPIC.md
```

---

## Key Principle

**PORT, DON'T REWRITE**
- Copy proven code from old system
- Adapt to TypeScript and new architecture
- Maintain same behavior and output
- Only fix known bugs

---

## Need Help?

See [docs/AI_AGENT_INSTRUCTIONS.md](./docs/AI_AGENT_INSTRUCTIONS.md) - Section "Getting Help"
