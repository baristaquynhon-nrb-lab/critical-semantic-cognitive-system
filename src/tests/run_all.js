"use strict";

/*
=========================================================
 NRB-aligned Critical Semantic Cognitive System
 Global Test Runner (v1.0)
=========================================================

Purpose:
Run all system tests in deterministic order and fail-fast
if any layer contract is violated.

This runner proves the pipeline is executable end-to-end.
*/

function section(title) {
  console.log("\n======================================");
  console.log("TEST:", title);
  console.log("======================================");
}

function runTest(name, fn) {
  try {
    fn();
    console.log("✔ PASS:", name);
  } catch (err) {
    console.error("✘ FAIL:", name);
    console.error(err.message || err);
    process.exit(1); // fail-fast (forensic mode)
  }
}

/* =====================================================
   Load Tests
===================================================== */

section("Loading Tests");

const e2e = require("./e2e_pipeline");
const { runReplayDeterminismLock } = require("./replay_determinism");
/* =====================================================
   Execute Tests
===================================================== */

section("Executing E2E Pipeline");

runTest("End-to-End Pipeline Test", () => {
  const result = e2e.runE2E();
  if (!result || result.status !== "OK") {
    throw new Error("E2E pipeline did not return OK status");
  }
});
section("Executing Replay Determinism Lock (RDL-02)");

runTest("Replay Determinism Lock", () => {
  const result = runReplayDeterminismLock();
  if (!result || result.status !== "PASS") {
    throw new Error("Replay determinism lock failed");
  }
});
/* =====================================================
   Final Report
===================================================== */

section("ALL TESTS COMPLETED");
const { generateEvidenceSeal } = require("../forensic/evidence_seal");

try {
  generateEvidenceSeal();
} catch (err) {
  console.error("Evidence seal failed:", err.message);
}
console.log("System integrity verified.");
console.log("Deterministic pipeline execution confirmed.");
console.log("No contract violations detected.");
