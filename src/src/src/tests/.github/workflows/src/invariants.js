"use strict";

/*
=========================================================
Invariant Enforcement Layer (IEL v1.0)
=========================================================

Role:
Runtime guard that checks architectural invariants.
If any invariant is violated → system must halt.

This layer protects epistemic correctness at runtime.
*/

const crypto = require("crypto");

/* ------------------------------------------------------
Utility
------------------------------------------------------ */

function sha256(x) {
  return crypto.createHash("sha256")
    .update(typeof x === "string" ? x : JSON.stringify(x))
    .digest("hex");
}

/* ------------------------------------------------------
I-EBM-01
Canonicalization must be idempotent

canonicalize(canonicalize(x)) === canonicalize(x)
------------------------------------------------------ */

function checkCanonicalIdempotence(canonicalizeFn, input) {
  const first = canonicalizeFn(input);
  const second = canonicalizeFn(first);

  const h1 = sha256(first);
  const h2 = sha256(second);

  if (h1 !== h2) {
    throw new Error("Invariant violation I-EBM-01: canonicalization not idempotent");
  }
}

/* ------------------------------------------------------
I-MEAN-01
Meaning fingerprint must match canonical evidence
------------------------------------------------------ */

function checkMeaningFingerprint(evidenceUnit, meaningState) {
  const expected = sha256(evidenceUnit.canonical_json);

  if (meaningState.semantic_fingerprint !== expected) {
    throw new Error("Invariant violation I-MEAN-01: semantic fingerprint mismatch");
  }
}

/* ------------------------------------------------------
I-LAW-01
Law verdict trace must bind to meaning fingerprint
------------------------------------------------------ */

function checkLawTraceBinding(meaningState, lawVerdict) {
  if (lawVerdict.meaning_fingerprint !== meaningState.semantic_fingerprint) {
    throw new Error("Invariant violation I-LAW-01: law trace detached from meaning");
  }
}

/* ------------------------------------------------------
Master Check
------------------------------------------------------ */

function enforceInvariants(context) {
  /*
  context structure:

  {
    canonicalize,
    input,
    evidenceUnit,
    meaningState,
    lawVerdict
  }
  */

  checkCanonicalIdempotence(context.canonicalize, context.input);
  checkMeaningFingerprint(context.evidenceUnit, context.meaningState);
  checkLawTraceBinding(context.meaningState, context.lawVerdict);
}

module.exports = { enforceInvariants };
