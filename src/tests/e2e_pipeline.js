"use strict";

/*
================================================
 FORENSIC INVARIANTS ENGINE v1.0
 Deterministic Integrity Enforcement Layer
================================================
*/

const crypto = require("crypto");

/* =================================================
   1. Canonicalization
================================================= */

function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);

  if (obj && typeof obj === "object") {
    return Object.keys(obj)
      .sort()
      .reduce((acc, k) => {
        if (obj[k] !== undefined) acc[k] = canonicalize(obj[k]);
        return acc;
      }, {});
  }

  return obj;
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function hashCanonical(obj) {
  return sha256(JSON.stringify(canonicalize(obj)));
}

/* =================================================
   2. Evidence Binding
================================================= */

function bindEvidence(canonicalInput) {
  if (!canonicalInput || canonicalInput.type !== "canonical_input") {
    throw new Error("INVALID_INPUT: canonical_input required");
  }

  const input_hash = hashCanonical(canonicalInput);
  const evidence_hash = sha256(input_hash);

  return {
    type: "evidence_unit",
    input_hash,
    evidence_hash,
    timestamp_bound: new Date().toISOString()
  };
}

/* =================================================
   3. System Invariant Enforcement
================================================= */

function enforceSystemInvariants(ctx) {
  const { evidenceUnit, meaningState, lawVerdict, actionPolicy } = ctx;

  // ---- Evidence invariants
  if (evidenceUnit) {
    if (evidenceUnit.type !== "evidence_unit") {
      throw new Error("INV_FAIL: evidence_unit.type");
    }
    if (evidenceUnit.input_hash.length !== 64) {
      throw new Error("INV_FAIL: evidence_unit.input_hash");
    }
    if (evidenceUnit.evidence_hash.length !== 64) {
      throw new Error("INV_FAIL: evidence_unit.evidence_hash");
    }
  }

  // ---- Meaning invariants
  if (meaningState) {
    if (meaningState.type !== "meaning_state") {
      throw new Error("INV_FAIL: meaning_state.type");
    }
    if (meaningState.evidence_hash !== evidenceUnit.evidence_hash) {
      throw new Error("INV_FAIL: meaning_state.evidence_binding");
    }
  }

  // ---- Law invariants
  if (lawVerdict) {
    if (lawVerdict.type !== "law_verdict") {
      throw new Error("INV_FAIL: law_verdict.type");
    }
    if (lawVerdict.meaning_fingerprint !== meaningState.semantic_fingerprint) {
      throw new Error("INV_FAIL: law.meaning_binding");
    }
  }

  // ---- Action invariants
  if (actionPolicy) {
    if (actionPolicy.type !== "action_policy") {
      throw new Error("INV_FAIL: action_policy.type");
    }
    if (actionPolicy.verdict !== lawVerdict.verdict) {
      throw new Error("INV_FAIL: action.verdict_binding");
    }
  }

  return true;
}

/* =================================================
   EXPORTS
================================================= */

module.exports = {
  canonicalize,
  hashCanonical,
  bindEvidence,
  enforceSystemInvariants
};
