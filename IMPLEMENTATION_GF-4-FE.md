# GF-4-FE Implementation: Canonical Evidence Endpoint + Milestone Enum Module

## Overview

This PR implements issue #141 (GF-4-FE), adopting the canonical evidence endpoint and creating a shared milestone enum module as specified in issues #136 and GF-4-BE (#142).

## Changes Made

### 1. Shared Enum Module (`lib/enums/index.ts`) ✅

Created a centralized enum module that serves as the single source of truth for all status enums:

- **MilestoneStatus Enum**: Canonical milestone statuses (`pending`, `approved`, `released`)
- **AgreementStatus Enum**: Agreement statuses (`pending`, `funded`, `active`, `completed`, `disputed`, `resolved`, `cancelled`)
- **AgreementType Enum**: Agreement types (`single`, `multi`, `bounty`)
- **ParticipantRole Enum**: Participant roles (`payer`, `payee`, `approver`, `dispute_resolver`, `validator`)

**Mapper Functions**:
- `mapLegacyToCanonical()`: Converts legacy `completed` → canonical `released`
- `mapCanonicalToLegacy()`: Converts canonical `released` → legacy `completed`

### 2. Canonical Evidence API (`lib/api/evidence.ts`) ✅

Created new evidence submission module using the canonical endpoint:

- **submitMilestoneEvidence()**: POST `/agreements/{agreementId}/milestones/{milestoneIndex}/evidence`
- **getMilestoneEvidence()**: GET `/agreements/{agreementId}/milestones/{milestoneIndex}/evidence`

**Key differences from deprecated path**:
- Uses `agreementId` instead of `contractId`
- Uses `/agreements/` path instead of `/escrow/`
- Matches GF-4-BE canonical contract

### 3. Updated `lib/api/agreements.ts` ✅

- Replaced inline enum types with imports from shared enum module
- Maintained backwards compatibility with existing type exports
- All milestone status types now use canonical `MilestoneStatusType`

### 4. Updated `lib/api/escrow.ts` ✅

- Replaced inline enum types with imports from shared enum module
- Marked `submitEvidence()` as **@deprecated** with console warning
- Added migration notice pointing to new canonical API
- Uses `LegacyMilestoneStatus` type for backwards compatibility

### 5. Comprehensive Test Suite ✅

**Enum Mapper Tests** (`lib/enums/__tests__/index.test.ts`):
- ✅ All enum value definitions
- ✅ `mapLegacyToCanonical()` for all status values
- ✅ `mapCanonicalToLegacy()` for all status values
- ✅ Bidirectional mapping consistency
- ✅ Error handling for invalid statuses
- ✅ Real-world migration scenarios

**Evidence API Tests** (`lib/api/__tests__/evidence.test.ts`):
- ✅ Canonical endpoint path validation
- ✅ HTTP method verification (POST/GET)
- ✅ Request body structure
- ✅ JWT token inclusion
- ✅ Evidence with/without files
- ✅ Success/error response handling
- ✅ Verification that deprecated `/escrow/` path is NOT used

## Migration Guide

### For New Code

Use the canonical evidence API:

```typescript
import { submitMilestoneEvidence } from "@/lib/api/evidence"
import { MilestoneStatus } from "@/lib/enums"

// Submit evidence
await submitMilestoneEvidence(
  agreementId,  // Use agreementId, not contractId
  milestoneIndex,
  {
    description: "Work completed as specified",
    files: ["https://example.com/proof.pdf"]
  },
  token
)
```

### For Legacy Code

The old `submitEvidence()` from `escrow.ts` still works but will log deprecation warnings:

```typescript
import { submitEvidence } from "@/lib/api/escrow" // DEPRECATED

// This still works but logs a warning
await submitEvidence(contractId, milestoneIndex, evidence, token)
```

### Status Mapping

When interfacing between old and new code:

```typescript
import { mapLegacyToCanonical, mapCanonicalToLegacy } from "@/lib/enums"

// Converting legacy "completed" to canonical
const canonical = mapLegacyToCanonical("completed") // returns "released"

// Converting canonical "released" to legacy
const legacy = mapCanonicalToLegacy(MilestoneStatus.RELEASED) // returns "completed"
```

## Technical Requirements Met

- ✅ Evidence submission points at canonical endpoint (`/agreements/{id}/milestones/{index}/evidence`)
- ✅ Inline enums replaced with shared module
- ✅ Legacy mappers implemented (`completed` ↔ `released`)
- ✅ Deprecated evidence path marked and will be removed in future version
- ✅ Reuses shared `apiRequest` from `lib/api/client.ts`
- ✅ Mirrors backend enum exactly (GF-4-BE)

## Testing

### Running Tests

```bash
npm test
```

### Test Coverage

- **Enum Tests**: 24 test cases covering all status values and mappers
- **Evidence API Tests**: 18 test cases covering canonical endpoint behavior
- **Total**: 42 test cases

### Key Test Scenarios

1. All mapper functions handle all valid status values
2. Bidirectional mapping maintains consistency
3. Evidence submission uses correct canonical path
4. Deprecated `/escrow/` path is NOT used
5. Agreement ID (not contract ID) is used in endpoints

## Backwards Compatibility

All changes maintain full backwards compatibility:

- Old type exports still work (`AgreementStatus`, `AgreementType`, etc.)
- Deprecated `submitEvidence()` function still works with warnings
- Legacy milestone status types are supported via mapper functions
- Existing code continues to function without modification

## Breaking Changes

**None** - All changes are additive with deprecation warnings.

## Dependencies

This PR depends on:
- **GF-4-BE** (ThalosBackend #142): Backend canonical evidence endpoint must be deployed
- **Issue #136**: Shared enum module (implemented in this PR)

## Related Issues

- Closes #141 (GF-4-FE)
- Implements #136 (FE enum module)
- Depends on ThalosBackend #142 (GF-4-BE)

## Proof of Completion

- ✅ Canonical evidence API implemented (`lib/api/evidence.ts`)
- ✅ Shared enum module created (`lib/enums/index.ts`)
- ✅ Legacy mappers implemented with full test coverage
- ✅ Deprecated path marked in `lib/api/escrow.ts`
- ✅ All inline enums replaced with shared module
- ✅ Comprehensive test suite (42 tests)
- ✅ Evidence submission hits canonical path
- ✅ Zero breaking changes

## Next Steps

1. Deploy backend GF-4-BE endpoint
2. Update UI components to use new canonical API
3. Remove deprecated `submitEvidence()` in next major version
4. Update documentation with new API patterns

## Files Changed

```
lib/enums/index.ts                          # NEW: Shared enum module
lib/enums/__tests__/index.test.ts          # NEW: Enum mapper tests
lib/api/evidence.ts                         # NEW: Canonical evidence API
lib/api/__tests__/evidence.test.ts         # NEW: Evidence API tests
lib/api/agreements.ts                       # MODIFIED: Use shared enums
lib/api/escrow.ts                           # MODIFIED: Use shared enums, deprecate old endpoint
```

## Author

- **Author**: rindicomfort
- **Email**: kwarpojonathanrindi@gmail.com
- **Branch**: `feat/gf-4-fe-canonical-evidence-endpoint`
