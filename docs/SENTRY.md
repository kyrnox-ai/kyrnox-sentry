# SENTRY runtime

SENTRY is the edge runtime that gates an LLM coding agent against a signed mission bundle. This document describes the runtime contract; for the hackathon plan see [`../IMPLEMENTATION_PLAN.md`](../IMPLEMENTATION_PLAN.md).

## Lifecycle

```
load bundle → verify signature → verify firmware baseline → open ledger →
  run agent loop {
    tool request → evaluateToolPolicy → ledger.append → forward or deny
  } →
flush ledger → optional export to Mission Authority
```

## CLI

```sh
kyrnox sentry run            --bundle <path>     # main runtime
kyrnox sentry verify-ledger  [--db <path>]       # walk hash chain, report breaks
kyrnox sentry inspect-bundle --bundle <path>     # signature + manifest summary
```

## Bundle envelope (signed)

```jsonc
{
  "bundle": {
    "id": "maritime-mission-2026-05-02",
    "version": "1",
    "geoAOIs": [
      { "id": "hormuz", "bbox": [55.0, 24.0, 58.0, 27.5] }
    ],
    "firmwareBaseline": [
      { "path": ".pio/build/esp32dev/firmware.bin", "sha256": "..." },
      { "path": ".pio/libdeps/esp32dev/AISParser/AISParser.cpp", "sha256": "..." }
    ],
    "toolPolicies": [
      { "toolName": "pio.build_project", "action": "allow" },
      { "toolName": "pio.upload_firmware", "action": "allow",
        "argAllowlist": { "port": ["/dev/ttyUSB0"] } },
      { "toolName": "pio.install_library", "action": "deny" },
      { "toolName": "ais.query_vessels", "action": "allow", "geoAOIRef": "hormuz" },
      { "toolName": "shell", "action": "deny" }
    ],
    "...": "rest of EnterprisePolicyBundle"
  },
  "signature": "<base64 Ed25519>",
  "signerKeyId": "demo-2026-05-02",
  "signedAt": "2026-05-02T18:00:00Z"
}
```

## Ledger row

```ts
interface LedgerRow {
  index: number
  timestamp: string
  prevHash: string   // hex SHA-256 of the previous row's eventHash, or 64 zeros for index 0
  eventHash: string  // hex SHA-256 of (prevHash || canonicalJSON(event))
  event: EnterpriseAuditEvent
}
```

`HashChainedAuditLedger.verify()` walks the SQLite table in order, recomputing each `eventHash`. If any row's stored hash does not match the recomputation, verification fails with the offending index.

## PlatformIO MCP integration

We integrate [`jl-codes/platformio-mcp`](https://github.com/jl-codes/platformio-mcp) as a git submodule at `vendor/platformio-mcp`. The `PlatformIOMcpClient` in `packages/llms` connects via `@modelcontextprotocol/sdk`'s `StdioClientTransport`, enumerates the 12 tools, and wraps every `CallTool` request through `evaluateToolPolicy()`. Argument-level constraints are enforced from the bundle (e.g., `upload_firmware.port` allowlist).

After any successful `build_project` call, `FirmwareBaselineVerifier` re-hashes the configured globs and aborts the run with a tamper alert if the hash deviates from the signed manifest.
