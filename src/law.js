"use strict";

/*
Law Evaluation Layer (LEL v1.0)

Input: MeaningState
Output: LawVerdict

LawVerdict structure:

{
  type: "law_verdict",
  version: "v1.0",
  meaning_fingerprint,
  verdict,
  trace_hash
}
*/

const crypto = require("crypto");

function sha256(obj) {
  return crypto.createHash("sha256")
    .update(JSON.stringify(obj))
    .digest("hex");
}

/*
Deterministic rule placeholder:

If drift_score == 0 → STABLE
If drift_score > 0  → CHANGE_DETECTED
*/

function evaluateLaw(meaningState) {
  let verdict = "STABLE";

  if (meaningState.drift_score > 0) {
    verdict = "CHANGE_DETECTED";
  }

  const trace_hash = sha256({
    meaning_fingerprint: meaningState.semantic_fingerprint,
    verdict
  });

  return {
    type: "law_verdict",
    version: "v1.0",
    meaning_fingerprint: meaningState.semantic_fingerprint,
    verdict,
    trace_hash
  };
}

module.exports = { evaluateLaw };
