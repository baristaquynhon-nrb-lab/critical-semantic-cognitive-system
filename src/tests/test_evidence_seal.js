"use strict";

/*
TEST EVIDENCE SEAL — Forensic Artifact Generator
Transforms runtime test result into cryptographically sealed evidence.
*/

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { runReplayDeterminismLock } = require("./replay_determinism");
const { bindEvidence } = require("../invariants");
const { stabilizeMeaning } = require("../meaning");
const { evaluateLaw } = require("../law");
const { generateActionPolicy } = require("../action");

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function canonicalize(obj) {
  if (Array.isArray(obj)) return obj.map(canonicalize);
  if (obj && typeof obj === "object") {
    return Object.keys(obj).sort().reduce((acc, k) => {
      acc[k] = canonicalize(obj[k]);
      return acc;
    }, {});
  }
  return obj;
}

function sealEvidence() {
  const canonicalInput = {
    type: "canonical_input",
    version: "v1.0",
    timestamp: "2026-02-08T00:00:00Z",
    payload: { data: "hello" }
  };

  // Run full pipeline
  const ev = bindEvidence(canonicalInput);
  const ms = stabilizeMeaning(ev, null);
  const lv = evaluateLaw(ms);
  const ap = generateActionPolicy(lv);

  // Confirm test still passes
  const testResult = runReplayDeterminismLock();
  if (testResult.status !== "PASS") {
    throw new Error("RDL-02 did not pass. Evidence not sealed.");
  }

  const evidence = {
    test: "RDL-02 Replay Determinism Lock",
    timestamp: new Date().toISOString(),
    input_hash: sha256(JSON.stringify(canonicalInput)),
    evidence_hash: ev.evidence_hash,
    meaning_fp: ms.semantic_fingerprint,
    law_trace: lv.trace_hash,
    policy_trace: ap.trace_hash,
    result: "PASS"
  };

  const forensicHash = sha256(JSON.stringify(canonicalize(evidence)));
  evidence.forensic_hash = forensicHash;

  const outDir = path.join(__dirname, "../../forensic_logs/RDL-02");
  fs.mkdirSync(outDir, { recursive: true });

  const filename = new Date().toISOString().replace(/[:.]/g, "-") + ".json";
  const outPath = path.join(outDir, filename);

  fs.writeFileSync(outPath, JSON.stringify(evidence, null, 2));

  console.log("🔒 Evidence sealed:", outPath);
  console.log("Forensic hash:", forensicHash);

  return { status: "SEALED", file: outPath, hash: forensicHash };
}

module.exports = { sealEvidence };
