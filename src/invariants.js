"use strict";

const crypto = require("crypto");

function assert(cond, msg) {
  if (!cond) throw new Error("INVARIANT FAIL: " + msg);
}

function isHex64(x) {
  return typeof x === "string" && /^[0-9a-f]{64}$/i.test(x);
}

/**
 * Canonical JSON (shallow + sorted keys).
 * For SIL binding material, we only canonicalize shallow policy projection.
 */
function canonicalShallowSorted(obj) {
  const out = {};
  for (const k of Object.keys(obj).sort()) out[k] = obj[k];
  return JSON.stringify(out);
}

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * SIL-01 Forensic Trace Binding (deterministic, replay-safe)
 *
 * We bind ActionPolicy.trace_hash to:
 *   Evidence hash + Meaning fingerprint + Law verdict + optional law_fingerprint + canonical policy projection
 */
function computeTraceBinding({ evidence_hash, semantic_fingerprint, lawVerdict, actionPolicy }) {
  const policyProj = {
    action: actionPolicy?.action ?? null,
    policy_id: actionPolicy?.policy_id ?? null,
    priority: Number.isFinite(actionPolicy?.priority) ? actionPolicy.priority : null,
    requires_human: typeof actionPolicy?.requires_human === "boolean" ? actionPolicy.requires_human : null,
  };

  const material =
    "SIL-01|v1|" +
    String(evidence_hash) + "|" +
    String(semantic_fingerprint) + "|" +
    String(lawVerdict?.verdict) + "|" +
    String(lawVerdict?.law_fingerprint ?? "") + "|" +
    canonicalShallowSorted(policyProj);

  return sha256(material);
}

/**
 * SIL-01 – Cross-Layer Binding Check (forensic-grade)
 *
 * Contract:
 *   evidenceUnit.evidence_hash: 64-hex
 *   meaningState.evidence_hash: 64-hex
 *   meaningState.semantic_fingerprint: stable meaning hash (string)
 *   lawVerdict.verdict: ALLOW|REFUSE|ESCALATE (string)
 *   lawVerdict.meaning_fingerprint: must equal meaningState.semantic_fingerprint
 *   actionPolicy.verdict: must equal lawVerdict.verdict
 *   actionPolicy.trace_hash: must equal computeTraceBinding(...)
 */
function enforceSystemInvariants({ evidenceUnit, meaningState, lawVerdict, actionPolicy }) {
  // 0) Basic presence
  assert(evidenceUnit && meaningState && lawVerdict && actionPolicy, "Missing required objects");

  // 1) Meaning must bind Evidence
  assert(
    isHex64(meaningState.evidence_hash) && isHex64(evidenceUnit.evidence_hash),
    "Evidence hash must be 64-hex"
  );
  assert(
    meaningState.evidence_hash === evidenceUnit.evidence_hash,
    "Meaning not bound to Evidence"
  );

  // 2) Law must bind Meaning
  assert(
    typeof meaningState.semantic_fingerprint === "string" && meaningState.semantic_fingerprint.length > 0,
    "Missing meaning semantic_fingerprint"
  );
  assert(
    lawVerdict.meaning_fingerprint === meaningState.semantic_fingerprint,
    "Law not bound to Meaning"
  );

  // 3) Policy must bind Law
  assert(
    typeof lawVerdict.verdict === "string" && lawVerdict.verdict.length > 0,
    "Missing law verdict"
  );
  assert(
    actionPolicy.verdict === lawVerdict.verdict,
    "Policy verdict drift"
  );

  // 4) Forensic trace must be deterministic binding
  assert(isHex64(actionPolicy.trace_hash), "Policy trace_hash must be 64-hex");

  const expected = computeTraceBinding({
    evidence_hash: evidenceUnit.evidence_hash,
    semantic_fingerprint: meaningState.semantic_fingerprint,
    lawVerdict,
    actionPolicy,
  });

  assert(actionPolicy.trace_hash === expected, "Forensic trace mismatch");
}

module.exports = { enforceSystemInvariants, computeTraceBinding };
