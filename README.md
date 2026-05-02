# Kyrnox SENTRY

> **Tamper-evident governance for AI coding agents on the tactical edge.**
> 3rd Annual NatSec Hackathon submission — Problem Statements 4 (Digital Defense) and 2 (Edge Deployments).

Kyrnox SENTRY sits between an LLM coding agent and the toolchain it controls. Every tool call (PlatformIO MCP, AIS, Danti, shell) is gated by a **cryptographically signed mission bundle**. Every decision is appended to a **hash-chained audit ledger** that detects out-of-band tampering. Compiled firmware is **baseline-verified** against a signed manifest before it can be flashed. Agents keep their speed; operators keep a tamper-evident chain of custody.

## The 60-second demo

```sh
# one-time, on the demo machine
./scripts/prewarm-platformio.sh

# the demo
npm run demo
```

The demo shows three blocked attacks against an ESP32 maritime AIS pod (simulated in Wokwi):

1. **Supply-chain tamper** — adversary flips a byte in a built library; SENTRY's firmware baseline verifier blocks the next flash.
2. **Dependency confusion** — prompt-injected agent tries `install_library AIS_Decoder@2.0.1`; bundle allowlist denies.
3. **Rogue upload port** — agent tries `upload_firmware --port /dev/ttyUSB1`; bundle-pinned port denies.

Then `kyrnox sentry verify-ledger` proves the audit chain is intact, and a one-byte tamper of the audit DB is instantly detected.

See [`docs/demo-script.md`](docs/demo-script.md) for the full storyboard and [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) for the architecture.

## Why this matters

LLM agents are increasingly used to write, build, and flash firmware for sensor pods, drones, and other autonomous systems. Prompt-injection, dependency confusion, model tampering, and supply-chain attacks all target this surface. SENTRY makes those attacks **detectable and recoverable**, not silent.

- **Cryptographically signed mission bundles (Ed25519)** — only the Mission Authority's bundles can configure SENTRY.
- **Per-tool, per-argument policy gating** — denies AOI-out-of-bounds AIS/Danti queries, off-allowlist library installs, wrong upload ports.
- **Hash-chained audit ledger** — every decision links to the previous; flip a row, the chain breaks at exactly that row.
- **Firmware baseline verifier** — hashes built `.bin` and library sources against a signed manifest before any flash.
- **Edge-friendly** — runs from a single CLI, SQLite-backed, no cloud dependency at runtime.

## Repository layout

```text
apps/cli                The kyrnox sentry edge runtime
apps/control-plane      Mission Authority (Go): signs/serves bundles, ingests audit
packages/shared         Bundle, policy, audit, and integrity contracts
packages/core           Policy engine, audit service, integrity primitives
packages/llms           Codex agent + gated tool wrappers (PlatformIO MCP, AIS, Danti)
packages/enterprise     Local key store and bundle cache
bundles                 Signed mission bundles + Ed25519 demo keys
wokwi                   ESP32 mission-pod sketch (AIS poller, OLED, LEDs)
demo                    Red-team harness and 60s demo orchestrator
docs                    Architecture, threat model, demo script
vendor/platformio-mcp   git submodule: jl-codes/platformio-mcp (12 PlatformIO tools)
```

## Quickstart for developers

```sh
git clone --recurse-submodules https://github.com/kyrnox-ai/kyrnox.git
cd kyrnox
npm install
(cd vendor/platformio-mcp && npm install && npm run build)
npm run typecheck
npm run test
```

Run the Mission Authority locally:

```sh
cd apps/control-plane
go run ./cmd/migrate
go run ./cmd/server
```

Run the SENTRY runtime against a signed bundle:

```sh
npm run build --workspace @kyrnox/cli
node apps/cli/dist/main.js sentry run --bundle bundles/maritime-mission.bundle.json
```

## Documentation

- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — full hackathon plan, reuse map, build order, risks.
- [`docs/SENTRY.md`](docs/SENTRY.md) — runtime architecture and integration details.
- [`docs/threat-model.md`](docs/threat-model.md) — attacker model and mitigations.
- [`docs/demo-script.md`](docs/demo-script.md) — 60-second demo storyboard.
- [`docs/architecture.md`](docs/architecture.md) — package and host-app architecture.

## License

MIT. See [`LICENSE`](LICENSE).
