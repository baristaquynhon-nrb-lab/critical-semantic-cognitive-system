-"use strict";
-
-function assert(cond, msg) {
-  if (!cond) throw new Error("INVARIANT FAIL: " + msg);
-}
-
-/**
- * SIL-01 Cross-Layer Binding Check
- */
-function enforceSystemInvariants({ evidenceUnit, meaningState, lawVerdict, actionPolicy }) {
-
-  // 1️⃣ Meaning must bind Evidence
-  assert(
-    meaningState.evidence_hash === evidenceUnit.evidence_hash,
-    "Meaning not bound to Evidence"
-  );
-
-  // 2️⃣ Law must bind Meaning
-  assert(
-    lawVerdict.meaning_fingerprint === meaningState.semantic_fingerprint,
-    "Law not bound to Meaning"
-  );
-
-  // 3️⃣ Policy must bind Law
-  assert(
-    actionPolicy.verdict === lawVerdict.verdict,
-    "Policy verdict drift"
-  );
-
-  // 4️⃣ Policy trace must depend on Meaning
-  assert(
-    typeof actionPolicy.trace_hash === "string" && actionPolicy.trace_hash.length === 64,
-    "Policy trace missing"
-  );
-}
-
-module.exports = { enforceSystemInvariants };
+"use strict";
+
+const crypto = require("crypto");
+
+function assert(cond, msg) {
+  if (!cond) throw new Error("INVARIANT FAIL: " + msg);
+}
+
+// -----------------------------
+// Canonical JSON serializer
+// -----------------------------
+function canonical(obj) {
+  return JSON.stringify(
+    Object.keys(obj).sort().reduce((o, k) => {
+      o[k] = obj[k];
+      return o;
+    }, {})
+  );
+}
+
+function sha256(str) {
+  return crypto.createHash("sha256").update(str).digest("hex");
+}
+
+// -----------------------------
+// Forensic trace binding
+// -----------------------------
+function computeTraceBinding(evidence_hash, semantic_fingerprint, lawVerdict, actionPolicy) {
+
+  const proj = {
+    action: actionPolicy.action ?? null,
+    policy_id: actionPolicy.policy_id ?? null,
+    priority: Number.isFinite(actionPolicy.priority) ? actionPolicy.priority : null,
+    requires_human: typeof actionPolicy.requires_human === "boolean" ? actionPolicy.requires_human : null,
+  };
+
+  const action_core = canonical(proj);
+
+  const material =
+    "SIL-01|v1|" +
+    String(evidence_hash) + "|" +
+    String(semantic_fingerprint) + "|" +
+    String(lawVerdict.verdict) + "|" +
+    String(lawVerdict.law_fingerprint ?? "") + "|" +
+    action_core;
+
+  return sha256(material);
+}
+
+/**
+ * SIL-01 – Court-Grade Cross-Layer Forensic Lock
+ */
+function enforceSystemInvariants({ evidenceUnit, meaningState, lawVerdict, actionPolicy }) {
+
+  // 1️⃣ Evidence ↔ Meaning
+  assert(
+    meaningState.evidence_hash === evidenceUnit.evidence_hash &&
+    typeof meaningState.evidence_hash === "string" &&
+    meaningState.evidence_hash.length === 64,
+    "Meaning not bound to Evidence"
+  );
+
+  // 2️⃣ Meaning ↔ Law
+  assert(
+    lawVerdict.meaning_fingerprint === meaningState.semantic_fingerprint,
+    "Law not bound to Meaning"
+  );
+
+  // 3️⃣ Law ↔ Policy verdict
+  assert(
+    actionPolicy.verdict === lawVerdict.verdict,
+    "Policy verdict drift"
+  );
+
+  // 4️⃣ Forensic trace lock
+  const expectedTrace = computeTraceBinding(
+    evidenceUnit.evidence_hash,
+    meaningState.semantic_fingerprint,
+    lawVerdict,
+    actionPolicy
+  );
+
+  assert(
+    actionPolicy.trace_hash === expectedTrace,
+    "Forensic trace mismatch"
+  );
+}
+
+module.exports = { enforceSystemInvariants };
