# Kyrnox SENTRY

```text
// CLASSIFIED // KYRNOX SENTRY // ENFORCEMENT: DENY // FAIL-CLOSED
▮ SDK + TOOLS + CLI ▮ APACHE-2.0 ▮ NO TELEMETRY ▮ DENY-BY-DEFAULT
```

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![CI](https://github.com/kyrnox-ai/kyrnox-sentry/actions/workflows/ci.yml/badge.svg)](https://github.com/kyrnox-ai/kyrnox-sentry/actions/workflows/ci.yml)

## // MISSION

Kyrnox SENTRY guards defense-tech LLM coding agents. It loads a signed,
identity-filtered policy bundle, evaluates every proposed tool call against
that bundle, and refuses to dispatch the call when the bundle says deny.
The runtime contract is fail-closed: a missing bundle, a malformed bundle,
a signature mismatch, an expired bundle, or a deny match all collapse to
the same outcome — the tool is not invoked and the attempt is recorded.
Audience is operators, red-teamers, and engineers who already think in
authority-to-operate terms; SENTRY is a control surface, not a chat product.

## // PRIMITIVES

Four integrity primitives ship in `@kyrnox/sentry-sdk`. Two of them are
real today; two of them are typed v1 stubs whose signatures are frozen so
dependents can pin against the contract while hardening lands. The full
status table is tracked in [`STUBS.md`](STUBS.md).

- **`evaluateToolPolicy`** — pure decision function for a single tool call.
  File: `packages/sentry-sdk/src/policy/tool-policy-engine.ts`. Status: ▶
  implemented, unit-tested, fail-closed on `action: "deny"`. This is the
  load-bearing primitive every other surface ultimately calls.
- **`BundleSigner`** (Ed25519) — sign / verify the policy envelope.
  File: `packages/sentry-sdk/src/integrity/BundleSigner.ts`. Symbols:
  `BundleSigner`, `SignedEnvelope`, `KeyStore`. Status: ⚠ v1 stub. Today
  the CLI's `verify` command validates the zod schema and reports
  `SIGNATURE: STUB`; cryptographic verification lands with the SENTRY
  hardening pass.
- **`HashChainedAuditLedger`** — SHA-256 hash-chained, append-only audit
  rows; tamper detection via chain replay. File:
  `packages/sentry-sdk/src/integrity/HashChainedAuditLedger.ts`. Symbols:
  `HashChainedAuditLedger`, `LedgerRow`. Status: ⚠ v1 stub. `tail()` is
  callable today (it returns `[]` until the writer is wired); `append()`
  and `verify()` throw `not yet implemented`. Read-only consumers — e.g.
  the `kyrnox-sentry status` TUI — MUST only call `tail()`.
- **`FirmwareBaselineVerifier`** — digest-equality check of an attested
  build manifest against a signed baseline. File:
  `packages/sentry-sdk/src/integrity/FirmwareBaselineVerifier.ts`.
  Symbols: `FirmwareBaselineVerifier`, `FirmwareBaselineEntry`,
  `FirmwareCheckInput`. Status: ⚠ v1 stub.
- **`GeoAOIPolicy`** — point-in-polygon Area of Interest check, with
  optional role filtering. File:
  `packages/sentry-sdk/src/integrity/GeoAOIPolicy.ts`. Symbols:
  `GeoAOIPolicy`, `GeoAOI`, `GeoPoint`. Status: ⚠ v1 stub.

## // CLI

The OSS binary is `kyrnox-sentry`. Color is rendered in signal-amber
(`#FFB000`) for headings, NATO-green (`#39FF14`) for ALLOWED, warning-red
(`#FF003C`) for DENIED, signal-amber for REQUIRED, restricted-cyan
(`#00E5FF`) for identity, gunmetal (`#1A1F26`) for muted chrome, all on
matte-black (`#05070A`). The blocks below were captured with
`FORCE_COLOR=0` so the ANSI escapes are stripped for paste; live
terminals render in color.

### `task` — start a SENTRY task

```text
$ kyrnox-sentry task "Refactor the auth module"
{
  "sessionId": "session-1746200000000",
  "status": "started",
  "mode": "act",
  "bundleLoaded": false
}
```

### `run` — headless task run

```text
$ kyrnox-sentry run "Tell me about my repo"
{
  "sessionId": "session-1746200000000",
  "status": "started",
  "bundleLoaded": false
}
```

### `config` — print resolved configuration

```text
$ kyrnox-sentry config
Kyrnox SENTRY config
Bundle path: /home/operator/.kyrnox/enterprise/bundle.json
Provider settings: /home/operator/.kyrnox/provider-settings.json
Default provider/model: openai/gpt-4o-mini
Providers: openai, anthropic, mock
```

### `provider` — list providers and models

```text
$ kyrnox-sentry provider list
{
  "providers": [
    { "id": "openai", "name": "OpenAI", "defaultModelId": "gpt-4o-mini", "apiKeyEnv": "OPENAI_API_KEY" },
    { "id": "anthropic", "name": "Anthropic", "defaultModelId": "claude-3-5-sonnet-20241022", "apiKeyEnv": "ANTHROPIC_API_KEY" }
  ]
}
```

### `history` — task history surface

```text
$ kyrnox-sentry history list
{
  "action": "list",
  "sessions": [],
  "message": "Kyrnox history command surface is available; persistent session history will be populated by the runtime integration."
}
```

### `checkpoint` — checkpoint surface

```text
$ kyrnox-sentry checkpoint status
{
  "action": "status",
  "checkpoints": [],
  "message": "Kyrnox checkpoint command surface is available; checkpoint storage will be wired to runtime sessions."
}
```

### `doctor` — local environment check

```text
$ kyrnox-sentry doctor
Kyrnox SENTRY doctor: OK

Environment:
  ✓ KYRNOX_DATA_DIR  (using default)
  ✓ KYRNOX_PROVIDER_SETTINGS_PATH  (using default)
  ✓ KYRNOX_BUNDLE_PATH  (using default)

Bundle:
  ✓ /home/operator/.kyrnox/enterprise/bundle.json  (not present (run will execute without an enterprise bundle))
```

### `evaluate` — evaluate one hypothetical tool call

```text
$ kyrnox-sentry evaluate \
    --tool execute_command \
    --command "rm -rf /var" \
    --identity alice@dod.mil \
    --bundle ./bundle.json
// EVALUATION
STATUS       TOOL                     IDENTITY               REASON                                           TS
[  DENIED  ] ▮ execute_command          ▮ alice@dod.mil          ▮ Denied by enterprise policy p-shell-deny           ▮ 2026-05-03T02:24:35Z
```

DENIED renders in warning-red; the identity column is restricted-cyan.
Exit code is `1` on any non-allow decision and `2` if the bundle file
itself was unreadable (fail-closed).

### `verify` — schema-validate a bundle and report integrity

```text
$ kyrnox-sentry verify --bundle ./bundle.json
// BUNDLE INTEGRITY VERIFICATION
BUNDLE INTEGRITY: VERIFIED
SCHEMA:           VALID
SIGNATURE:        STUB
BUNDLE ID:        bundle-demo-001 v1.4.2
//   Ed25519 signature check stubbed; schema validated
STATUS       TOOL                     IDENTITY               REASON                                           TS
[ ALLOWED  ] ▮ session.start            ▮ alice@dod.mil          ▮ Bundle bundle-demo-001 v1.4.2 loaded from control-plane ▮ 2026-05-03T02:24:35Z
```

`SIGNATURE: STUB` is honest reporting until `BundleSigner.verify` lands.
A schema-invalid bundle reports `BUNDLE INTEGRITY: TAMPERED` in
warning-red and the synthetic `session.start` row collapses to DENIED.

### `status` — full-terminal ops dashboard (Ink TUI)

```text
$ kyrnox-sentry status --bundle ./bundle.json

╭─ ▮ BUNDLE ───────────────────────────╮  ╭─ ▮ POLICIES ─────────────────────────╮
│ ID:        bundle-demo-001           │  │ TOTAL: 4                             │
│ VERSION:   1.4.2                     │  │                                      │
│ SOURCE:    control-plane             │  │ ▮ ALLOW: 2   ▮ ASK: 1   ▮ DENY: 1    │
│ ISSUED:    2026-05-03T01:00:00Z      │  │                                      │
│ EXPIRES:   2026-06-03T01:00:00Z      │  │                                      │
│ INTEGRITY: VERIFIED                  │  │                                      │
╰──────────────────────────────────────╯  ╰──────────────────────────────────────╯
╭─ ▮ LEDGER ───────────────────────────╮  ╭─ ▮ IDENTITY ─────────────────────────╮
│ LEDGER TAIL: 0x58759e9c…90c2         │  │ SUBJECT: alice@dod.mil               │
│ EVENTS:      (stub)                  │  │ ORG:     org-signal-corps            │
│                                      │  │ ROLES:   operator ▮ auditor          │
╰──────────────────────────────────────╯  ╰──────────────────────────────────────╯
[ q ] EXIT   [ r ] REFRESH   [ j/k ] FOCUS                  UPDATED 2026-05-03T02:24:35Z
```

Panel borders render in gunmetal; INTEGRITY: VERIFIED is NATO-green;
identity values are restricted-cyan; the `q / r / j / k` chord line is
signal-amber. `--json` and non-TTY contexts emit a stable snapshot
instead of the TUI.

## // QUICKSTART

Verify a sample bundle and inspect it under the TUI. No publish step,
no SaaS account, no telemetry beacon.

```text
$ git clone https://github.com/kyrnox-ai/kyrnox-sentry.git
$ cd kyrnox-sentry
$ npm install
$ npm run typecheck
$ npm run test:unit

$ npx kyrnox-sentry verify --bundle ./bundle.json
$ npx kyrnox-sentry status --bundle ./bundle.json
```

## // WEB CONSOLE

Browser preview of the panel grid and red-team evaluator, deployed from
`apps/demo/`. Same palette, same fail-closed contract, same stubs called
out as ⚠ STUB chips that link to [`STUBS.md`](STUBS.md). No telemetry,
no third-party CDN, fonts self-hosted via `@fontsource/*`.

```text
https://kyrnox-ai.github.io/kyrnox-sentry/
```

To exercise the evaluator directly against one tool call:

```text
$ npx kyrnox-sentry evaluate \
    --tool execute_command \
    --command "rm -rf /var" \
    --identity alice@dod.mil \
    --bundle ./bundle.json
```

## // PRINCIPLES

1. ▮ Fail-closed. A decision that is not an explicit allow is a denial.
2. ▮ Deny-by-default. An empty bundle denies privileged tools; only an
   explicit allow row enables them.
3. ▮ Signed bundles only. Production runs require a bundle whose Ed25519
   envelope verifies under a known signer key (target state; today the
   CLI surfaces `SIGNATURE: STUB` honestly).
4. ▮ Audit append-only. The hash-chained ledger is write-once; tamper is
   detected by chain replay, never patched in place.
5. ▮ No silent telemetry. The OSS surface ships zero outbound network
   calls in the default code path. Telemetry, when wired, is opt-in and
   targets an operator-controlled OTel collector.
6. ▮ OSS evaluator under Apache-2.0. The decision function and the four
   integrity primitives are open and inspectable in this repo.
7. ▮ Multi-tenant features live elsewhere. Bundle CRUD, IAM, fleet
   management, command-center web UI, and GCP infrastructure ship in
   `kyrnox-ai/kyrnox-platform` under BSL 1.1.

## // REPOS

- `kyrnox-ai/kyrnox-sentry` — this repo. Public, Apache-2.0. SDK, tools,
  CLI.
- `kyrnox-ai/kyrnox-platform` — private, BSL 1.1, `Change Date =
  2030-05-02`, `Change License = Apache-2.0`. Multi-tenant control
  plane, Keycloak integration, command-center web UI, VS Code extension
  host, GCP infrastructure. Consumes `@kyrnox/sentry-sdk` as a
  dependency; never copies code back.
- `kyrnox-ai/kyrnox-archive` — public, archived. Read-only mirror of the
  pre-split monorepo at tag `v0-pre-split`. The pre-split history was
  distributed under MIT; that history is preserved in this repo's git
  log per [`NOTICE`](NOTICE).

## // LICENSE

Apache-2.0. See [`LICENSE`](LICENSE).

## // TYPOGRAPHY

Web demo and docs site render in Geist Mono with JetBrains Mono and
Space Mono fallbacks.
