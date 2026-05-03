# SENTRY hardening punch-list (stubs)

The SDK's public API surface for v1 is **frozen**: every symbol exported from `@kyrnox/sentry-sdk` will keep its signature through the SENTRY hardening pass. The implementations below currently throw `not yet implemented` so that dependents can pin against the contract today.

| Symbol | File | Status | Hardening notes |
|---|---|---|---|
| `evaluateToolPolicy` | `packages/sentry-sdk/src/policy/tool-policy-engine.ts` | ✅ implemented + tested | — |
| `EnterprisePolicyBundleSchema`, all type exports | `packages/sentry-sdk/src/types/` | ✅ implemented + tested | — |
| `FileBundleStore` | `packages/sentry-sdk/src/storage/FileBundleStore.ts` | ✅ implemented | — |
| `AuditService`, `AuditExporter` | `packages/sentry-sdk/src/audit/AuditService.ts` | ✅ implemented | OTel exporter wrapper TBD |
| `mergeInstructionSources` | `packages/sentry-sdk/src/prompt/instruction-merge.ts` | ✅ implemented | — |
| `EnterpriseTelemetryService` | `packages/sentry-sdk/src/telemetry/EnterpriseTelemetryService.ts` | ✅ scaffold | OTel SDK wiring lands with hardening |
| `BundleSigner` | `packages/sentry-sdk/src/integrity/BundleSigner.ts` | ⛔ stub | Ed25519 sign/verify, canonical JSON, key rotation, JWKS-style key publication |
| `KeyStore` interface | `packages/sentry-sdk/src/integrity/BundleSigner.ts` | ⛔ stub | File and KMS adapters; provide `MemoryKeyStore` for tests |
| `HashChainedAuditLedger` | `packages/sentry-sdk/src/integrity/HashChainedAuditLedger.ts` | ⛔ stub | SHA-256 chain, append-only writer, periodic anchor commitment, tamper-evidence verifier |
| `FirmwareBaselineVerifier` | `packages/sentry-sdk/src/integrity/FirmwareBaselineVerifier.ts` | ⛔ stub | digest comparison, version-gating, tie-in to signed baseline manifest |
| `GeoAOIPolicy` | `packages/sentry-sdk/src/integrity/GeoAOIPolicy.ts` | ⛔ stub | point-in-polygon, role filtering, audit reasons |

## Out of OSS scope (lives in `kyrnox-platform`)

These ship in the private commercial repo and consume `@kyrnox/sentry-sdk` as a dependency:

- Multi-tenant control plane (Go), bundle CRUD, IAM, audit ingestion, telemetry.
- Keycloak OIDC integration, device-code login, JWKS validation, claim mapping.
- Bundle materialization on disk, control-plane sync service, refresh worker.
- VS Code extension host, command-center web UI, GCP/k8s infra, GCP CI/CD.
- Demo + hackathon submission infrastructure (`apps/demo/`, `vendor/platformio-mcp/`, `apps/wokwi/`).

See [`docs/SENTRY.md`](docs/SENTRY.md) for the SENTRY hardening plan.
