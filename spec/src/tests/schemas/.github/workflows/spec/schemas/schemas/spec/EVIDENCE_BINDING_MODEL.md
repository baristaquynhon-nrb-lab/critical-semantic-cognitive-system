# Evidence Binding Model (EBM) — v1.0

This document defines the minimum deterministic evidence binding procedure.

---

## 1. Purpose

Convert `CanonicalInput` into a stable `EvidenceUnit` with audit-grade hashing.

---

## 2. Definitions

```text
Input:  CanonicalInput (schemas/canonical_input.schema.json)
Output: EvidenceUnit   (schemas/evidence_unit.schema.json)

3. Canonicalization Rule (Normative)

CANONICALIZE(x):
  - If object: sort keys lexicographically, drop undefined fields
  - If array: preserve order, canonicalize each element
  - If primitive: keep as-is

4. Hashing Rule (Normative)

input_hash    = SHA256( UTF8( JSON.stringify(CANONICALIZE(CanonicalInput)) ) )
evidence_hash = SHA256( UTF8( JSON.stringify(CANONICALIZE(EvidenceUnit.canonical_json)) ) )

5. Minimal EvidenceUnit Construction

EvidenceUnit fields:
type = "evidence_unit"
version = "v1.0"
input_hash = computed
canonical_json = CANONICALIZE(CanonicalInput)
evidence_hash = computed over canonical_json
notes = optional
6. Determinism Invariant (I-EBM-01)

Given identical CanonicalInput, EvidenceUnit.evidence_hash MUST be identical.

