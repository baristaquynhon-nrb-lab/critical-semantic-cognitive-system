"use strict";

/*
E2E Pipeline Test (v1.0)

Goal:
Prove the full pipeline executes deterministically end-to-end:

CanonicalInput
  -> bindEvidence()
  -> stabilizeMeaning()
  -> evaluateLaw()
  -> generateActionPolicy()
*/

const { bindEvidence } = require("../src/index");
const { stabilizeMeaning } = require("../src/meaning");
const { evaluateLaw } = require("../src/law");
const { generateActionPolicy } = require("../src/action");

function assert(cond, msg) {
  if (!cond) throw new Error("ASSERT_FAIL: " + msg);
}

function runE2E() {
  const canonicalInput = {
    type: "canonical_input",
    version: "v1.0",
    timestamp: "2026-02-08T00:00:00Z",
    payload: { data: "hello" }
  };

  const ev1 = bindEvidence(canonicalInput);
  const ms1 = stabilizeMeaning(ev1, null);
  const lv1 = evaluateLaw(ms1);
  const ap1 = generateActionPolicy(lv1);
  const { enforceSystemInvariants } = require("../src/invariants");

enforceSystemInvariants({
  evidenceUnit: ev1,
  meaningState: ms1,
  lawVerdict: lv1,
  actionPolicy: ap1
});
  // Basic structural assertions
  assert(ev1.type === "evidence_unit", "ev1.type");
  assert(ms1.type === "meaning_state", "ms1.type");
  assert(lv1.type === "law_verdict", "lv1.type");
  assert(ap1.type === "action_policy", "ap1.type");

  // Contract-like assertions
  assert(typeof ev1.input_hash === "string" && ev1.input_hash.length === 64, "ev1.input_hash");
  assert(typeof ev1.evidence_hash === "string" && ev1.evidence_hash.length === 64, "ev1.evidence_hash");

  assert(ms1.evidence_hash === ev1.evidence_hash, "ms1 binds to evidence_hash");
  assert(typeof ms1.semantic_fingerprint === "string" && ms1.semantic_fingerprint.length === 64, "ms1.semantic_fingerprint");

  assert(lv1.meaning_fingerprint === ms1.semantic_fingerprint, "lv1 binds to meaning_fingerprint");
  assert(typeof lv1.trace_hash === "string" && lv1.trace_hash.length === 64, "lv1.trace_hash");

  assert(ap1.verdict === lv1.verdict, "ap1 binds to verdict");
  assert(typeof ap1.trace_hash === "string" && ap1.trace_hash.length === 64, "ap1.trace_hash");

  // --------------------------------------------------
// Invariant Enforcement (IEL)
// --------------------------------------------------
enforceInvariants({
  canonicalize,
  input: canonicalInput,
  evidenceUnit: ev1,
  meaningState: ms1,
  lawVerdict: lv1
});

  // Determinism check: same input should produce same hashes
  const ev2 = bindEvidence(canonicalInput);
  const ms2 = stabilizeMeaning(ev2, null);
  const lv2 = evaluateLaw(ms2);
  const ap2 = generateActionPolicy(lv2);

  assert(ev2.input_hash === ev1.input_hash, "determinism: input_hash stable");
  assert(ev2.evidence_hash === ev1.evidence_hash, "determinism: evidence_hash stable");
  assert(ms2.semantic_fingerprint === ms1.semantic_fingerprint, "determinism: semantic_fingerprint stable");
  assert(lv2.trace_hash === lv1.trace_hash, "determinism: law trace stable");
  assert(ap2.trace_hash === ap1.trace_hash, "determinism: action trace stable");

  console.log("E2E PASS");
  console.log({
    evidence_hash: ev1.evidence_hash,
    semantic_fingerprint: ms1.semantic_fingerprint,
    law_verdict: lv1.verdict,
    action: ap1.action,
    safety_level: ap1.safety_level
  });
}

if (require.main === module) runE2E();

module.exports = { runE2E };
