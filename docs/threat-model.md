# Kyrnox SENTRY — Threat Model

```text
// CLASSIFIED // KYRNOX SENTRY THREAT MODEL // FAIL-CLOSED
▮ APACHE-2.0 ▮ DENY-BY-DEFAULT ▮ TAMPER-EVIDENT
```

## // SCOPE

This document covers the public OSS surface in
[`packages/sentry-sdk`](../packages/sentry-sdk),
[`packages/sentry-tools`](../packages/sentry-tools), and
[`packages/sentry-cli`](../packages/sentry-cli). Multi-tenant control-plane
threats (bundle CRUD, IAM, fleet) live in `kyrnox-ai/kyrnox-platform` and
are out of scope here.

## // ASSETS

- The signed mission bundle (tool policies, identity claims, AOIs,
  firmware baselines).
- The audit ledger (proof of operator and agent actions).
- The signing key (Ed25519 private key in a `KeyStore`).
- The agent's tool surface (the set of side-effecting calls the LLM is
  allowed to invoke).

## // ADVERSARIES

1. **Prompt-injection adversary** — text in inputs the agent reads
   (mission docs, sensor messages, web pages) coerces the agent into
   issuing tool calls outside its mandate.
2. **Supply-chain adversary** — modifies an artifact on disk between
   build and dispatch (library, firmware, vendored module).
3. **Insider with operator credentials** — has the operator workstation
   but not the Mission Authority signing key.
4. **Post-mission tamper** — modifies the audit DB to hide actions after
   the fact.

## // PER-PRIMITIVE STRIDE-ISH TABLES

Each table maps a primitive's most likely abuse to the SDK control that
mitigates it, and what residual exposure remains. Status of each
primitive is tracked in [`../STUBS.md`](../STUBS.md).

### ▮ `evaluateToolPolicy`

File: `packages/sentry-sdk/src/policy/tool-policy-engine.ts`.

| STRIDE | Threat |
|---|---|
| Tampering | Bundle modified locally to relax `action: "deny"` rows. |
| Spoofing | Agent claims a higher-privilege role than its identity. |
| Elevation | A `*` allow row is injected ahead of a specific deny row. |

`MITIGATION:` Pure decision function; no side effects; deny rows are
checked before allow rows; role intersection is required for any
`roles`-scoped policy. A future `BundleSigner.verify` boundary upstream
of the evaluator means an unsigned or mis-signed bundle never reaches
this function in production.

`RESIDUAL:` The evaluator trusts whatever bundle it is handed. A caller
that forgets to verify the envelope before evaluation defeats the
control. The CLI's `evaluate` and `verify` commands both load through
the schema; downstream embedders MUST do the same.

### ▮ `BundleSigner` (Ed25519)

File: `packages/sentry-sdk/src/integrity/BundleSigner.ts`. Status: ⚠ v1
stub; `sign()` and `verify()` throw `not yet implemented`.

| STRIDE | Threat |
|---|---|
| Tampering | One byte flipped in the signed payload. |
| Spoofing | Bundle re-signed by a key the operator does not trust. |
| Repudiation | Signer claims they did not sign a bundle that bears
their key. |

`MITIGATION:` Ed25519 signature over canonical JSON of the payload, with
a `keyId` and `signedAt` in the envelope. Verification is strict: any
deviation in the canonical form fails. Keys are loaded through a
`KeyStore` interface so file and KMS adapters can be swapped without
changing call sites.

`RESIDUAL:` Until hardening lands, the CLI's `verify` path reports
`SIGNATURE: STUB` and gates on schema validity only. Operators must not
treat schema-valid bundles as cryptographically authentic in this
window. The `verify` command output is intentionally honest about this
state.

### ▮ `HashChainedAuditLedger`

File: `packages/sentry-sdk/src/integrity/HashChainedAuditLedger.ts`.
Status: ⚠ v1 stub. `tail()` is callable; `append()` and `verify()` throw.

| STRIDE | Threat |
|---|---|
| Tampering | One row of the audit DB is rewritten to hide an action. |
| Repudiation | Operator denies an action that was logged. |
| Information Disclosure | Audit DB exfiltrated. |

`MITIGATION:` Each row's `prevHash` is the SHA-256 of the previous row's
serialized form, making the ledger tamper-evident: `verify()` walks the
chain and reports the exact index where it breaks. Append-only writer;
no in-place edit path. Periodic anchor commitment is planned so an
attacker who replaces the entire DB diverges from the recorded head on
next sync.

`RESIDUAL:` Until `append()` is wired, this OSS repo does not produce
ledger rows; consumers (e.g. the `kyrnox-sentry status` TUI) MUST treat
`tail()` as `[]` and not fabricate rows. Audit confidentiality is out of
scope; rows are operator-readable by design.

### ▮ `FirmwareBaselineVerifier`

File: `packages/sentry-sdk/src/integrity/FirmwareBaselineVerifier.ts`.
Status: ⚠ v1 stub.

| STRIDE | Threat |
|---|---|
| Tampering | Built artifact (`*.bin`, `*.cpp`) modified between build
and dispatch. |
| Spoofing | Adversary publishes a baseline manifest that pins their
own digests. |

`MITIGATION:` Re-hash the configured paths on every dispatch; compare
against the signed baseline manifest; mismatch aborts the call with a
deny + audit row. The baseline itself ships inside the signed bundle,
so trust in the manifest reduces to trust in `BundleSigner`.

`RESIDUAL:` Hardware attestation (Secure Boot, eFuse-backed keys) is out
of scope. A kernel-level rootkit on the operator workstation that
intercepts the hashing call is out of scope.

### ▮ `GeoAOIPolicy`

File: `packages/sentry-sdk/src/integrity/GeoAOIPolicy.ts`. Status: ⚠ v1
stub.

| STRIDE | Threat |
|---|---|
| Elevation | Agent attempts a tool call against a target outside the
allowed Area of Interest. |
| Spoofing | Identity outside its role-scoped AOI claims to be inside. |

`MITIGATION:` Point-in-polygon check against the bundle's `geoAOIs`,
with optional `roles` filtering on each AOI. Mismatch returns `allowed:
false` with a structured reason that propagates into the audit row.

`RESIDUAL:` Location is supplied by the caller; SENTRY does not
independently attest the operator's true position. The bundle author
must scope the AOI conservatively.

### ▮ `EnterprisePolicyBundleSchema` (zod)

File: `packages/sentry-sdk/src/types/schema.ts`.

| STRIDE | Threat |
|---|---|
| Tampering | Bundle reshaped to a structure that bypasses fields the
evaluator depends on. |

`MITIGATION:` Zod parse rejects unknown shapes; the CLI's `verify` and
`status` commands both gate on schema validity before downstream use.
The schema is the only authorized entry point for bundle JSON in the
SDK.

`RESIDUAL:` Schema validity is necessary but not sufficient — see
`BundleSigner` above for the cryptographic layer.

## // FAIL-CLOSED INVARIANTS

The runtime MUST refuse to dispatch a tool call when any of the
following hold. Each invariant cites the SDK file path that owns
enforcement.

1. ▮ **No bundle loaded.** `FileBundleStore.load()` returned undefined
   and no `--bundle` was supplied. File:
   `packages/sentry-sdk/src/storage/FileBundleStore.ts`.
2. ▮ **Schema mismatch.** `EnterprisePolicyBundleSchema.parse(...)`
   threw. File: `packages/sentry-sdk/src/types/schema.ts`.
3. ▮ **Signature mismatch.** `BundleSigner.verify(envelope)` returned
   false (target state — currently surfaced as `SIGNATURE: STUB` so the
   gap is visible). File:
   `packages/sentry-sdk/src/integrity/BundleSigner.ts`.
4. ▮ **Bundle expired.** `bundle.expiresAt` is in the past at decision
   time. File: `packages/sentry-sdk/src/types/schema.ts`.
5. ▮ **Deny match in `evaluateToolPolicy`.** Any matching policy with
   `action: "deny"` causes the decision to collapse to deny regardless
   of subsequent allow rows. File:
   `packages/sentry-sdk/src/policy/tool-policy-engine.ts`.
6. ▮ **AOI violation.** `GeoAOIPolicy.contains(point, roles)` returned
   `allowed: false` for the target location. File:
   `packages/sentry-sdk/src/integrity/GeoAOIPolicy.ts`.
7. ▮ **Firmware baseline mismatch.** `FirmwareBaselineVerifier.check(...)`
   returned `matched: false` for any component the bundle pins. File:
   `packages/sentry-sdk/src/integrity/FirmwareBaselineVerifier.ts`.

When any invariant fires, the runtime emits an audit row to the
`HashChainedAuditLedger` (target state — currently the row is shaped
through `AuditService` in
`packages/sentry-sdk/src/audit/AuditService.ts` and queued for the
ledger writer once hardening lands) and surfaces the deny in the CLI's
decision row in warning-red.

## // OUT OF SCOPE

- Hardware attestation of the edge device (Secure Boot, eFuse keys).
- Kernel-level rootkit on the operator workstation.
- Confidentiality of bundle contents (we sign, not encrypt; bundles are
  operator-readable by design for auditability).
- Multi-operator replay protection (target state in the platform repo).
