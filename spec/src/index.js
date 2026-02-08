"use strict";
const crypto = require("crypto");

/* =========================
   Canonicalization (EBM v1.0)
========================= */

function canonicalize(x) {
  if (Array.isArray(x)) {
    return x.map(canonicalize);
  }
  if (x && typeof x === "object") {
    return Object.keys(x)
      .sort()
      .reduce((acc, k) => {
        const v = x[k];
        if (v !== undefined) acc[k] = canonicalize(v);
        return acc;
      }, {});
  }
  return x;
}

/* =========================
   Hash helper
========================= */

function sha256Canonical(obj) {
  const canonical = JSON.stringify(canonicalize(obj));
  return crypto.createHash("sha256").update(canonical).digest("hex");
}

/* =========================
   Evidence Binding Runtime
========================= */

function bindEvidence(canonicalInput) {
  const canonical_json = canonicalize(canonicalInput);

  const input_hash = sha256Canonical(canonicalInput);

  const evidenceUnit = {
    type: "evidence_unit",
    version: "v1.0",
    input_hash,
    canonical_json,
    evidence_hash: null,
    notes: null
  };

  evidenceUnit.evidence_hash = sha256Canonical(evidenceUnit.canonical_json);

  return evidenceUnit;
}

module.exports = { bindEvidence };
