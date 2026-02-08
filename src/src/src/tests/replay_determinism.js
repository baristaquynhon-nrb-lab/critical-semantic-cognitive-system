diff --git a/src/tests/replay_determinism.js b/src/tests/replay_determinism.js
new file mode 100644
index 0000000..rdl02
--- /dev/null
+++ b/src/tests/replay_determinism.js
@@ -0,0 +1,163 @@
+"use strict";
+
+/*
+ RDL-02 — Replay Determinism Lock (v1.0)
+
+ Lock Contract:
+ Running the SAME canonical_input twice MUST produce IDENTICAL:
+
+   ev.input_hash
+   ev.evidence_hash
+   ms.semantic_fingerprint
+   lv.trace_hash
+   ap.trace_hash
+
+ Any mismatch = system is NOT deterministic.
+*/
+
+const crypto = require("crypto");
+
+const { bindEvidence } = require("../evidence");
+const { stabilizeMeaning } = require("../meaning");
+const { evaluateLaw } = require("../law");
+const { generateActionPolicy } = require("../action");
+
+function assert(cond, msg) {
+  if (!cond) throw new Error(msg || "assertion_failed");
+}
+
+function sha256_json(obj) {
+  return crypto.createHash("sha256")
+    .update(JSON.stringify(obj))
+    .digest("hex");
+}
+
+function runOnce(canonicalInput) {
+  const ev = bindEvidence(canonicalInput);
+  const ms = stabilizeMeaning(ev, null);
+  const lv = evaluateLaw(ms);
+  const ap = generateActionPolicy(lv);
+  return { ev, ms, lv, ap };
+}
+
+function checkEquality(a, b, label) {
+  assert(a === b, "RDL02 mismatch: " + label);
+}
+
+function runReplayDeterminismLock() {
+  console.log("RDL-02: Replay Determinism Lock");
+
+  const canonicalInput = {
+    type: "canonical_input",
+    version: "v1.0",
+    timestamp: "2026-02-08T00:00:00Z",
+    payload: { data: "hello" }
+  };
+
+  const r1 = runOnce(canonicalInput);
+  const r2 = runOnce(canonicalInput);
+
+  console.log("Checking Evidence hashes...");
+  checkEquality(r1.ev.input_hash, r2.ev.input_hash, "ev.input_hash");
+  checkEquality(r1.ev.evidence_hash, r2.ev.evidence_hash, "ev.evidence_hash");
+
+  console.log("Checking Meaning fingerprint...");
+  checkEquality(
+    r1.ms.semantic_fingerprint,
+    r2.ms.semantic_fingerprint,
+    "ms.semantic_fingerprint"
+  );
+
+  console.log("Checking Law trace...");
+  checkEquality(r1.lv.trace_hash, r2.lv.trace_hash, "lv.trace_hash");
+
+  console.log("Checking Action Policy trace...");
+  checkEquality(r1.ap.trace_hash, r2.ap.trace_hash, "ap.trace_hash");
+
+  console.log("RDL-02 LOCK PASSED — deterministic replay confirmed.");
+}
+
+if (require.main === module) {
+  runReplayDeterminismLock();
+}
+
+module.exports = { runReplayDeterminismLock };
+
