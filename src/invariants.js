"use eprstrict strict";

function assert(cond, msg) {
  if (!cond) throw new Error("INVARIANT FAIL: " + msg);
}

/**
 * SIL-01 Cross-Layer Binding Check
 */
function enforceSystemInvariants({ evidenceUnit, meaningState, lawVerdict, actionPolicy }) {

  // 1️⃣ Meaning must bind Evidence
  assert(
    meaningState.evidence_hash === evidenceUnit.evidence_hash,
    "Meaning not bound to Evidence"
  );

  // 2️⃣ Law must bind Meaning
  assert(
    lawVerdict.meaning_fingerprint === meaningState.semantic_fingerprint,
    "Law not bound to Meaning"
  );

  // 3️⃣ Policy must bind Law
  assert(
    actionPolicy.verdict === lawVerdict.verdict,
    "Policy verdict drift"
  );

  // 4️⃣ Policy trace must depend on Meaning
  assert(
    typeof actionPolicy.trace_hash === "string" && actionPolicy.trace_hash.length === 64,
    "Policy trace missing"
  );
}

module.exports = { enforceSystemInvariants };
