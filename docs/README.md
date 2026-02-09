# COI Migration Documentation

**Clean, organized documentation for COI migration project.**

---

## 📚 Documentation Structure

### Core Documents (Use These!)

| Document | Purpose | When to Use |
|----------|---------|-------------|
| **[COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md)** | **Master tracking checklist** | Track progress, check off completed items |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | Quick lookup card | Daily coding reference, print and keep handy |
| **[story0-implementation.md](./story0-implementation.md)** | Story 0 execution guide | Setting up TypeScript & project structure |
| **[story1-implementation.md](./story1-implementation.md)** | Story 1 execution guide | Data layer & MongoDB integration |
| **[story2-implementation.md](./story2-implementation.md)** | Story 2 execution guide | Transform layer enhancement |
| **[story3-implementation.md](./story3-implementation.md)** | Story 3 execution guide | Configuration management |

### Context Documents

| Document | Purpose |
|----------|---------|
| **[COI_MIGRATION_EPIC.md](./COI_MIGRATION_EPIC.md)** | Full epic overview with all stories |
| **[AI_AGENT_INSTRUCTIONS.md](./AI_AGENT_INSTRUCTIONS.md)** | Instructions for AI agents |

---

## 🎯 How to Use This Documentation

### Starting Story 0?

1. **Read:** [story0-implementation.md](./story0-implementation.md)
2. **Track:** Check off items in [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#story-0-setup)
3. **Reference:** Use [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for quick lookups

### Working on Story 1+?

1. **Read:** `story{N}-implementation.md` for your current story
2. **Track:** Check off items in [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md)
3. **Reference:** Use [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for critical differences

### Need Coverage Details?

Check [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md) sections:
- Section 1: Data Extraction (18 fields)
- Section 2: Helper Functions (7 functions)
- Section 3: Validations (12 checks)
- Section 4: Transformations
- Section 5: PDF Generation
- Section 6: Delivery
- Section 7: Configuration

---

## 📊 What's Covered

### Canada COI
- **Entry:** 232 lines from `sendCertificateOfInsurance.ts`
- **Generate:** 222 lines from `generate.ts`
- **Total:** 454 lines of proven code

### US COI
- **Entry:** 127 lines from `sendUsCertificateOfInsurance.ts`
- **Generate:** 240 lines from `generate.ts`
- **Total:** 367 lines of proven code

### Helper Functions (7 total)
All documented in [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#21-functions-to-port)

---

## ⚡ Quick Links

### Old System (Reference Only - DO NOT MODIFY)
```
~/Desktop/repos/foxden-policy-document-backend/
├── src/services/certificateOfInsurance/     # Canada COI
├── src/services/UScertificateOfInsurance/   # US COI
├── src/services/utils/                      # Helper functions
└── src/utils/                               # Utilities
```

### New System (Implementation Target)
```
/home/hestergong/Downloads/coi-mvp-etl/
├── src/data/                 # Data layer (Story 1)
├── src/generator/            # ETL pipeline
├── src/config/               # Configuration (Story 3)
├── src/delivery/             # Delivery (Story 4)
└── templates/                # Assets
```

---

## 🔍 Find Information Fast

**"What fields do I need to extract from MongoDB?"**
→ [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#11-canada-coi---data-fields)

**"What's the difference between Canada and US date formats?"**
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md#critical-differences-dont-mix-these-up)

**"Which helper functions do I need to port?"**
→ [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md#21-functions-to-port)

**"How do I set up TypeScript?"**
→ [story0-implementation.md](./story0-implementation.md#quick-start-copy-paste-commands)

---

## ✅ Progress Tracking

Use [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md) master status table:

```
| Category           | Items | Completed | Story   |
|--------------------|-------|-----------|---------|
| Data Extraction    | 18    | 0/18      | Story 1 |
| Helper Functions   | 7     | 0/7       | Story 1 |
| Validations        | 8     | 0/8       | Story 1 |
| Transformations    | 12    | 0/12      | Story 2 |
| PDF Generation     | 2     | 0/2       | Story 2 |
| Delivery           | 3     | 0/3       | Story 4 |
| Configuration      | 4     | 0/4       | Story 3 |
```

---

## 📝 Document Updates

**Last Reorganized:** 2026-02-09
**Changes:**
- ✅ Removed duplicate documents (COVERAGE_ANALYSIS.md, STORY0_EXECUTION_PLAN.md)
- ✅ Consolidated into COVERAGE_MATRIX.md (single source of truth)
- ✅ Created QUICK_REFERENCE.md (print-friendly)
- ✅ Simplified story guides
- ✅ Added this README

---

**Start Here:** [COVERAGE_MATRIX.md](./COVERAGE_MATRIX.md) | **Quick Ref:** [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
