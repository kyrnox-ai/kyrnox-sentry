# Kyrnox SENTRY — Implementation Plan

> **3rd Annual NatSec Hackathon submission.** A tamper-evident governance and integrity layer for AI coding agents operating on edge sensor systems.

## 1. Mission

Operators on the tactical edge increasingly rely on LLM-driven coding agents to build, patch, and flash firmware for sensor pods, drones, and other autonomous systems. That same agent surface is a soft target: prompt-injection, dependency confusion, model tampering, and supply-chain attacks can quietly compromise mission-critical software before it ever reaches the field.

**Kyrnox SENTRY** is a defense-in-depth layer between the agent and the toolchain. Every tool the agent invokes — PlatformIO MCP, AIS feeds, Danti, shell, file I/O — is gated by a **cryptographically signed mission bundle**. Every decision is appended to a **hash-chained audit ledger** that detects out-of-band tampering. Compiled firmware is **baseline-verified** against a signed manifest before it can be flashed. The result: agents can keep their speed advantage on the edge while operators retain a tamper-evident chain of custody on every action.

## 2. Problem-statement alignment

- **Primary — PS #4 (Digital Defense and Cybersecurity), example 3:** *"Create a deployable security scanning toolkit that validates containerized AI model deployments against known-good baselines, detecting anomalous files, tampered libraries, or embedded threats before models influence operational decisions."*
- **Secondary — PS #2 (Edge Deployments and Drone Operation), example 3:** *"Develop a real-time sensor processing pipeline deployable on edge hardware ... performs local target detection, and pushes prioritized alerts without reliance on cloud infrastructure."*

SENTRY addresses PS #4 directly (the scanning + baselining toolkit) and supports PS #2 by hardening the edge AI pipeline that builds and operates the sensor pod.

## 3. Judging-criteria optimization

| Criterion | Weight | How SENTRY wins it |
|---|---|---|
| Technical Demo | 35% | Live red-team in a single terminal: three real attacks blocked on camera, hash-chain verification at the end. Zero slides. |
| Military Impact | 30% | Direct DoD pain point: AI supply-chain integrity, prompt-injection on edge agents, tamper-evident logs for after-action review. |
| Solution Creativity | 25% | Defensive-AI angle in a field of sensor/drone-builders. Cryptographic ledger + firmware integrity is uncommon in hackathon submissions. |
| Presentation | 10% | Pre-rehearsed 60-second storyboard, single terminal window, three blocked attacks, one verification command. |

## 4. Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        OPERATOR LAPTOP (edge)                        │
│                                                                      │
│   ┌────────────────────────────────────────────────────────────┐     │
│   │                    Kyrnox SENTRY runtime                   │     │
│   │                                                            │     │
│   │   ┌──────────────┐      ┌─────────────────────────────┐    │     │
│   │   │ Codex agent  │─────►│  evaluateToolPolicy()       │    │     │
│   │   │ (ReAct loop) │      │  + GeoAOIPolicy             │    │     │
│   │   └──────────────┘      │  + FirmwareBaselineVerifier │    │     │
│   │          ▲              └────────────┬────────────────┘    │     │
│   │          │                           │ allow/ask/deny      │     │
│   │          │                           ▼                     │     │
│   │   ┌──────────────────────────────────────────────────┐     │     │
│   │   │            HashChainedAuditLedger (sqlite)       │     │     │
│   │   └──────────────────────────────────────────────────┘     │     │
│   │          ▲                           │                     │     │
│   │          │                           ▼                     │     │
│   │   ┌──────────────┬───────────────┬──────────────────┐      │     │
│   │   │PlatformIO MCP│   AIS / Danti │ Shell / FS tools │      │     │
│   │   │  (12 tools)  │   OSINT tools │                  │      │     │
│   │   └──────┬───────┴───────────────┴──────────────────┘      │     │
│   │          │ stdio MCP                                        │     │
│   │          ▼                                                  │     │
│   │   vendor/platformio-mcp (jl-codes/platformio-mcp)          │     │
│   └────────────────────────────────────────────────────────────┘     │
│             │                                                        │
│             ▼                                                        │
│   ┌──────────────────────┐    flash    ┌────────────────────────┐    │
│   │  .pio/build/*.bin    │────────────►│  ESP32 mission pod     │    │
│   │  (verified vs        │             │  (Wokwi sim, AIS LED)  │    │
│   │   firmwareBaseline)  │             └────────────────────────┘    │
│   └──────────────────────┘                                           │
└────────────────────────────────────────────────────────────────────┬─┘
                                                                     │
                                       signed bundle + ledger flush  │
                                                                     ▼
                                          ┌────────────────────────────┐
                                          │  Mission Authority (Go)    │
                                          │  apps/control-plane        │
                                          │  - signs/serves bundles    │
                                          │  - ingests audit events    │
                                          │  - verifies ledger chains  │
                                          └────────────────────────────┘
```

## 5. Reuse map

We rewrite-in-place: ~70% of the existing Kyrnox scaffold is repurposed; the SENTRY-specific layer (~30%) is the hackathon contribution.

### Kept and repurposed
| Existing path | New role |
|---|---|
| `packages/shared/src/enterprise/types.ts` | Reused. Add `signature`, `signerKeyId`, `firmwareBaseline`, `geoAOI` fields to `EnterprisePolicyBundle`. |
| `packages/shared/src/enterprise/schema.ts` (zod) | Reused. Extend with signed envelope and firmware manifest schemas. |
| `packages/core/src/policy/tool-policy-engine.ts` | Reused. Add geo-AOI matcher and firmware-hash matcher. |
| `packages/core/src/policy/EnterprisePolicyEngine.ts` | Becomes the SENTRY core. Adds `verifyBundleSignature()` step before any evaluation. |
| `packages/core/src/audit/AuditService.ts` | Wrapped by `HashChainedAuditLedger`. |
| `apps/control-plane/` (Go) | Becomes the **Mission Authority**: signs and serves bundles, ingests audit events, verifies ledger chains. Drops Keycloak coupling — single Ed25519 keypair + bearer token. |
| `apps/cli/` | Becomes `kyrnox sentry`. |
| `packages/llms/` | Hosts the OpenAI Codex adapter and gated tool wrappers. |

### Cut for the hackathon (moved to `.archive/`)
- `apps/vscode-extension` — not demoable in 60 seconds.
- `apps/command-center` — same.
- `infra/gcp/{k8s,terraform}` and `scripts/deploy-gcp.sh` — out of scope.
- `packages/rpc`, `packages/scheduler`, `packages/agents` — empty stubs; not needed.
- Keycloak and most of `packages/enterprise` — replaced with `LocalSigningKeyStore`.

### New components (SENTRY layer)

**Crypto and integrity**
- `packages/core/src/integrity/BundleSigner.ts` — Ed25519 sign/verify on top of `node:crypto`.
- `packages/core/src/integrity/HashChainedAuditLedger.ts` — `prev_hash || event_hash` chain, SQLite-backed via `better-sqlite3`. Provides `append()`, `verify()`, `tail(n)`.
- `packages/core/src/integrity/FirmwareBaselineVerifier.ts` — hashes a glob (e.g. `.pio/build/**/*.bin`, `.pio/libdeps/**/*.cpp`) and compares to manifest in bundle.
- `packages/core/src/integrity/GeoAOIPolicy.ts` — point-in-bbox + bbox-in-bbox checks for AIS/Danti calls.

**Gated tools (each ~80 LOC)**
- `packages/llms/src/tools/PlatformIOMcpClient.ts` — spawns `node vendor/platformio-mcp/build/index.js` via `@modelcontextprotocol/sdk` stdio client. Per-tool, per-arg policy gating on all 12 MCP tools.
- `packages/llms/src/tools/AISTool.ts` — hits `https://data.aishub.net` (or the Kaggle vessel-traffic CSV for offline demo); enforces AOI bbox.
- `packages/llms/src/tools/DantiTool.ts` — calls Danti API if access lands; AOI-gated. Stub gracefully if no key.
- `packages/llms/src/tools/ShellTool.ts` — `execa` wrapper with bundle-controlled command allowlist.

**Agent**
- `packages/llms/src/agents/CodexAgent.ts` — minimal ReAct loop using OpenAI Codex (`gpt-4o-mini` fallback). Tools registered, transcript exposed for the TUI. ~150 LOC.

**SENTRY runtime**
- `apps/cli/src/commands/sentry.ts` — `kyrnox sentry run|verify-ledger|inspect-bundle`.
- `apps/cli/src/sentry/SentryRuntime.ts` — orchestrates: load bundle → verify signature → verify firmware baseline → start agent loop → gate every tool call → append to ledger.
- `apps/cli/src/sentry/dashboard.tsx` — `ink` split-pane TUI (left: agent transcript; right: live decisions + ledger tail).

**Edge device**
- `wokwi/mission-pod/diagram.json` + `sketch.ino` — ESP32 + OLED + 3 LEDs; pulls AIS JSON over Wi-Fi, lights LED red on watchlist match.
- `wokwi/mission-pod/wokwi.toml` — points at firmware built by PlatformIO.

**Mission bundle**
- `bundles/maritime-mission.bundle.json` — signed bundle: AOI bbox, allowed MCP tools, firmware SHA-256 manifest, vessel watchlist.
- `bundles/sign.ts` — dev script to sign a bundle with the demo Ed25519 key.
- `bundles/keys/demo-public.pem` — committed; the matching private key is generated locally and **not** committed.

**Red-team demo harness**
- `demo/redteam/01-supplychain-tamper.ts` — flips a byte in `.pio/libdeps/**/AISParser.cpp` after build; SENTRY's firmware verifier blocks the next flash.
- `demo/redteam/02-dep-confusion.ts` — prompt-injects the agent to `install_library` something off-allowlist; policy denies.
- `demo/redteam/03-rogue-port.ts` — agent attempts `upload_firmware` to `/dev/ttyUSB1`; bundle pins the port, denies.
- `demo/run-demo.sh` — orchestrates the 60-second demo flow.

## 6. PlatformIO MCP integration

We integrate [`jl-codes/platformio-mcp`](https://github.com/jl-codes/platformio-mcp) as a git submodule at `vendor/platformio-mcp`. The server exposes 12 tools over stdio (`list_boards`, `get_board_info`, `list_devices`, `init_project`, `build_project`, `clean_project`, `upload_firmware`, `upload_filesystem`, `start_monitor`, `search_libraries`, `install_library`, `list_installed_libraries`).

`PlatformIOMcpClient` connects to the server with `@modelcontextprotocol/sdk`'s `Client` and `StdioClientTransport`. Every `CallTool` request is intercepted: SENTRY runs `evaluateToolPolicy()` with `toolName = "pio.<mcp_tool_name>"`, plus argument-level constraints derived from the bundle. Examples:

- `pio.upload_firmware` — `port` argument must match `commandAllowlist` (`/dev/ttyUSB0` only).
- `pio.install_library` — `library` argument must be in `commandAllowlist`.
- `pio.build_project` — always allowed; the resulting `.bin` is fed into `FirmwareBaselineVerifier` post-build.

A denial returns an MCP-protocol error to the agent without forwarding the call to the PlatformIO server.

## 7. Data model additions

```ts
// extensions to EnterprisePolicyBundle
interface SignedEnvelope {
  bundle: EnterprisePolicyBundle
  signature: string         // base64 Ed25519
  signerKeyId: string       // matches bundles/keys/<id>.pem
  signedAt: string
}

interface FirmwareBaselineEntry {
  path: string              // glob, relative to project root
  sha256: string
}

interface GeoAOI {
  // simple bbox: [minLon, minLat, maxLon, maxLat]
  bbox: [number, number, number, number]
  description?: string
}

// extensions to EnterpriseToolPolicy
interface ToolPolicyExtensions {
  argAllowlist?: Record<string, string[]>   // arg-name -> allowed values
  argDenylist?: Record<string, string[]>
  geoAOIRef?: string                        // bundle.geoAOIs[id]
}

// hash-chained ledger row
interface LedgerRow {
  index: number
  timestamp: string
  prevHash: string          // hex SHA-256
  eventHash: string         // hex SHA-256 over (prevHash || canonicalJSON(event))
  event: EnterpriseAuditEvent
}
```

## 8. Demo storyboard (60 seconds)

| t | Screen | Narration |
|---|---|---|
| 0:00 | `kyrnox sentry run --bundle bundles/maritime-mission.bundle.json` | "Operator launches the mission. Bundle signature verifies. Firmware baseline verifies." |
| 0:08 | Agent: "build the mission firmware" → MCP `build_project` → ✅ | "Codex builds via PlatformIO MCP. Ledger row appended." |
| 0:18 | Agent: "install AIS_Decoder@2.0.1" → MCP `install_library` → ❌ | "Prompt-injected dependency confusion — blocked: not on allowlist." |
| 0:28 | Out-of-band: red-team script flips a byte in a built `.cpp`. Agent retries `build_project` → ❌ | "Supply-chain tamper: post-build hash mismatch. Flash blocked." |
| 0:40 | Agent: `upload_firmware --port /dev/ttyUSB1` → ❌ | "Mission bundle pins the upload port. Denied." |
| 0:48 | `kyrnox sentry verify-ledger` → ✅ chain intact | "Tamper-evident audit chain. Verified." |
| 0:54 | Editor flips a byte in audit DB; re-verify → ❌ break detected at row N | "Out-of-band log tamper detected." |
| 1:00 | Tagline overlay | "Trust, but cryptographically verify, every AI action at the edge." |

## 9. Build order and parallelization

| # | Block | Hours | Owner (4-person team) |
|---|---|---|---|
| 0 | Repo hygiene: archive cuts, rewrite docs, add submodule, update workspaces | 1 | P1 |
| 1 | Crypto core: `BundleSigner`, `HashChainedAuditLedger`, `FirmwareBaselineVerifier`, `GeoAOIPolicy` | 2 | P1 |
| 2 | Bundle schema extension; demo Ed25519 keypair; `bundles/sign.ts`; sample bundle | 1 | P1 |
| 3 | `PlatformIOMcpClient` with per-tool gating | 2 | P2 |
| 4 | `ShellTool`, `AISTool` (Kaggle CSV fallback), `DantiTool` stub | 2 | P2 |
| 5 | `CodexAgent` ReAct loop | 2 | P2 |
| 6 | `SentryRuntime` and `kyrnox sentry` CLI commands | 2 | P1 |
| 7 | `ink` TUI dashboard | 2 | P3 |
| 8 | Wokwi mission-pod sketch + AIS poller | 1.5 | P4 |
| 9 | Red-team scripts + `demo/run-demo.sh` | 2 | P3 |
| 10 | Docs (`SENTRY.md`, `threat-model.md`, `demo-script.md`) | 1 | P4 |
| 11 | Rehearse + record 60-second video | 1.5 | All |
| 12 | Submit | 0.5 | P1 |
| | **Total** | **~20h** | |

## 10. Test plan

- **Unit (vitest):** `BundleSigner` round-trip + signature mismatch; `HashChainedAuditLedger` tamper detection (flip a row, expect verify failure at exact index); `FirmwareBaselineVerifier` mismatch detection; `evaluateToolPolicy` arg-level allow/deny including geo-AOI.
- **Unit (Go):** Mission Authority signs a bundle the TS verifier accepts; ingests an audit batch.
- **Integration:** `demo/run-demo.sh` must exit 0 with all three attacks blocked and the final ledger verification passing. CI runs this on every push.
- **Manual smoke:** PlatformIO build of the Wokwi pod sketch; ensure `.bin` is produced and matches manifest; ensure baseline mismatch is detected after a forced byte flip.

## 11. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| PlatformIO toolchain first-run latency (~500MB ESP32 toolchain) | High | `scripts/prewarm-platformio.sh` runs `pio platform install espressif32` pre-event. |
| OpenAI Codex / API quota at the venue | Medium | `gpt-4o-mini` fallback; deterministic scripted "agent" mode for the demo. |
| Danti API access doesn't land in time | Medium | `DantiTool` stubs gracefully; demo works on AIS alone. |
| AIS Hub rate-limits at the venue | Medium | Bundled offline fallback: Kaggle vessel-traffic CSV. |
| Wokwi simulator network issues | Low | Demo block #1 (supply-chain tamper) does not require Wokwi at all; pod is the visible cherry. |
| "New work only" hackathon rule scrutiny | Low | All Cline-derived language removed from docs; the SENTRY layer (signing, ledger, verifier, runtime, MCP gating, red-team harness, Wokwi pod) is genuinely new work this weekend. |

## 12. Submission checklist

- [ ] Public GitHub repo at `github.com/kyrnox-ai/kyrnox` with `IMPLEMENTATION_PLAN.md`, rewritten `README.md`, `docs/SENTRY.md`, `docs/threat-model.md`, `docs/demo-script.md`.
- [ ] One-command demo: `npm run demo` runs the red-team script end-to-end.
- [ ] 60-second Loom or YouTube video following `docs/demo-script.md`.
- [ ] Submission filed at `cerebralvalley.ai/e/3rd-annual-natsec-hackathon/submit`.
- [ ] Repo `LICENSE` confirmed open-source (MIT already present; will become Apache-2.0 in the post-event split).

## 13. Post-event handoff

After the hackathon submission is filed, the monorepo will be split into a public OSS SDK (`kyrnox-sentry`, Apache-2.0) and a private commercial platform (`kyrnox-platform`, BSL 1.1 → Apache-2.0 on 2030-05-02). The full bootstrap context for executing that split — license choices, file-by-file classification, API boundary, migration steps, archival strategy, and risks — lives in [`docs/REPO_SPLIT_HANDOFF.md`](docs/REPO_SPLIT_HANDOFF.md). A fresh Cline session or teammate can pick up the split cold from that document.
