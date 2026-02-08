"use strict";

/*
AUTO_EVIDENCE_SEAL_GENERATOR_v1.0
Creates cryptographic evidence record after successful test execution.
*/

const fs = require("fs");
const crypto = require("crypto");
const { execSync } = require("child_process");

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

function getGitCommitHash() {
  return execSync("git rev-parse HEAD").toString().trim();
}

function getGitTag() {
  try {
    return execSync("git describe --tags --exact-match").toString().trim();
  } catch {
    return "UNRELEASED";
  }
}

function readLog() {
  return fs.readFileSync("full_test_log.txt", "utf8");
}

function loadLedger() {
  if (!fs.existsSync("evidence_ledger.json")) return [];
  return JSON.parse(fs.readFileSync("evidence_ledger.json", "utf8"));
}

function saveLedger(ledger) {
  fs.writeFileSync("evidence_ledger.json", JSON.stringify(ledger, null, 2));
}

function generateEvidenceSeal() {
  const log = readLog();
  const commit = getGitCommitHash();
  const tag = getGitTag();

  const record = {
    type: "forensic_evidence_seal",
    version: "v1.0",
    timestamp: new Date().toISOString(),
    commit_hash: commit,
    tag: tag,
    log_hash: sha256(log),
    composite_hash: sha256(commit + tag + log)
  };

  const ledger = loadLedger();
  ledger.push(record);
  saveLedger(ledger);

  console.log("✓ Evidence Seal Generated");
  console.log(record);
}

module.exports = { generateEvidenceSeal };
