# Kyrnox SENTRY Architecture

Kyrnox SENTRY is a tamper-evident governance and integrity layer for AI coding agents operating on edge sensor systems. It is composed of a TypeScript edge runtime (CLI), a Go Mission Authority service, gated tool wrappers, and a hash-chained audit ledger.

## TypeScript layers

- `packages/shared` — bundle, policy, audit, and integrity contracts (zod schemas, signed envelopes, firmware manifests, geo-AOI).
- `packages/core` — policy engine, audit service, and integrity primitives (Ed25519 signer, hash-chained ledger, firmware baseline verifier, geo-AOI policy).
- `packages/llms` — OpenAI Codex agent adapter, ReAct loop, and gated tool wrappers (PlatformIO MCP client, AIS, Danti, shell).
- `packages/enterprise` — local Ed25519 signing-key store and bundle cache.

## Host apps

- `apps/cli` — `kyrnox sentry run|verify-ledger|inspect-bundle`. Loads a signed mission bundle, verifies its signature and firmware baseline, runs the agent loop with full tool gating, and flushes the audit ledger.
- `apps/control-plane` — Go Mission Authority: signs and serves bundles, ingests audit batches, verifies ledger chains.

## SENTRY runtime flow

1. Operator runs `kyrnox sentry run --bundle <path>`.
2. `BundleSigner.verify()` validates the Ed25519 signature against the trusted public-key store.
3. `FirmwareBaselineVerifier` hashes any pre-existing build artifacts and aborts on mismatch.
4. `SentryRuntime` initializes the policy engine with the bundle and opens the SQLite-backed `HashChainedAuditLedger`.
5. The Codex agent runs a ReAct loop. Every tool invocation passes through `evaluateToolPolicy()` (with arg-level allow/deny and geo-AOI checks). Allowed calls reach the underlying tool (e.g., the PlatformIO MCP server) and the result is observed by the agent. Denied calls return a structured error to the agent without forwarding.
6. Every decision (allow / ask / deny) is appended to the ledger as a row whose `eventHash = SHA-256(prevHash || canonicalJSON(event))`.
7. After the run, `kyrnox sentry verify-ledger` walks the chain to detect any out-of-band tampering and optionally exports to the Mission Authority.

## Tool gating model

Every gated tool resolves to a stable `toolName` (for example `pio.upload_firmware`, `ais.query_vessels`). Tool policies in the bundle support:

- `action`: `allow | ask | deny`
- `commandAllowlist` / `commandDenylist` (substring or pattern, applied to the canonical command string)
- `pathAllowlist` / `pathDenylist`
- `argAllowlist` / `argDenylist` (per-argument value lists, e.g., `port: ["/dev/ttyUSB0"]`)
- `geoAOIRef` — references a bbox declared in the bundle; AIS and Danti calls must fall within the AOI.
- `roles`, `maxRisk` — retained from the original policy schema.

A denial returns to the caller before the underlying side effect runs.

## Mission Authority (Go)

The control plane is a small Echo-style HTTP API. Its responsibilities for the hackathon scope are limited to:

- `POST /v1/bundles/sign` — sign a candidate bundle with the Mission Authority's private key.
- `GET /v1/bundles/{id}` — return the latest signed bundle for an operator.
- `POST /v1/audit/batch` — ingest a batch of `LedgerRow` records and recompute the hash chain server-side.
- `GET /v1/audit/{operator}/verify` — return the latest verified head and any detected breaks.

The existing internal package layout (`internal/domain/{policy,audit,identity,telemetry}`, `internal/lib/{auth,db,middleware,o11y,rbac}`) is reused; Keycloak coupling is replaced with a static bearer-token + Ed25519 keypair appropriate for the hackathon demo.

## Edge device

`wokwi/mission-pod` is an ESP32 sketch that polls AIS JSON over Wi-Fi, lights an OLED with the nearest watchlist vessel, and toggles three status LEDs. The firmware is built by the PlatformIO MCP server invoked from the agent and is gated by SENTRY's firmware baseline verifier before any upload.

## Out of scope for the hackathon

The original Kyrnox VS Code extension, command-center web app, GKE/Terraform infrastructure, scheduler, RPC, and Keycloak realm have been moved to `.archive/` to keep the demo surface area minimal. They can be reintroduced post-event without changes to the SENTRY core.
