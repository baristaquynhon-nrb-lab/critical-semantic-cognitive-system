"use strict";
const crypto = require("crypto");

/* =========================
   Meaning Stabilization Layer (MSL v1.0)
========================= */

function sha256(obj) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex");
}

/*
MeaningState structure:

{
  type: "meaning_state",
  version: "v1.0",
  evidence_hash,
  semantic_fingerprint,
  drift_score
}
*/

function stabilizeMeaning(evidenceUnit, previousState = null) {
  const semantic_fingerprint = sha256(evidenceUnit.canonical_json);

  let drift_score = 0;

  if (previousState && previousState.semantic_fingerprint !== semantic_fingerprint) {
    drift_score = 1; // placeholder for future semantic distance metric
  }

  return {
    type: "meaning_state",
    version: "v1.0",
    evidence_hash: evidenceUnit.evidence_hash,
    semantic_fingerprint,
    drift_score
  };
}

module.exports = { stabilizeMeaning };
