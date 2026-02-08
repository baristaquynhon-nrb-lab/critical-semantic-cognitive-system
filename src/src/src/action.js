"use strict";

/*
Action Policy Layer (APL v1.0)

Input: LawVerdict
Output: ActionPolicy

ActionPolicy structure:

{
  type: "action_policy",
  version: "v1.0",
  verdict,
  action,
  safety_level,
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
Deterministic action mapping:

STABLE → CONTINUE
CHANGE_DETECTED → REVIEW
*/

function mapAction(verdict) {
  switch (verdict) {
    case "STABLE":
      return { action: "CONTINUE", safety_level: "NORMAL" };
    case "CHANGE_DETECTED":
      return { action: "REVIEW", safety_level: "ELEVATED" };
    default:
      return { action: "HALT", safety_level: "CRITICAL" };
  }
}

function generateActionPolicy(lawVerdict) {
  const { action, safety_level } = mapAction(lawVerdict.verdict);

  const trace_hash = sha256({
    verdict: lawVerdict.verdict,
    action,
    safety_level
  });

  return {
    type: "action_policy",
    version: "v1.0",
    verdict: lawVerdict.verdict,
    action,
    safety_level,
    trace_hash
  };
}

module.exports = { generateActionPolicy };
