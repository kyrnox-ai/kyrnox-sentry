# SENTRY threat model

## Assets
- The compiled firmware (`*.bin`) flashed to the edge sensor pod.
- Source libraries pulled into `.pio/libdeps/`.
- The signed mission bundle (AOI, allowlists, firmware manifest).
- The audit ledger (proof of operator actions for after-action review).

## Adversaries
1. **Prompt-injection adversary** — embeds malicious instructions in inputs the LLM agent reads (mission docs, AIS messages, web pages). Goal: make the agent install rogue libraries, exfiltrate data, or flash hostile firmware.
2. **Supply-chain adversary** — compromises a transitive PlatformIO library or modifies files on disk between build and flash.
3. **Insider with operator credentials** — has the laptop but not the Mission Authority private key.
4. **Post-mission tamper** — modifies the audit DB after the fact to hide actions.

## SENTRY mitigations

| Adversary | Vector | SENTRY control |
|---|---|---|
| Prompt-injection | Agent issues `pio.install_library` for an off-allowlist package | `argAllowlist` on `library` arg → deny + audit |
| Prompt-injection | Agent queries AIS/Danti outside AOI | `GeoAOIPolicy` bbox check → deny + audit |
| Prompt-injection | Agent pivots to `shell` to run arbitrary commands | `shell` tool denied by default; only listed wrappers allowed |
| Supply-chain | `.pio/libdeps/**/*.cpp` modified after install | `FirmwareBaselineVerifier` rehashes pre-flash → mismatch → flash blocked |
| Supply-chain | Built `firmware.bin` modified | Same as above |
| Insider | Operator edits a local bundle to relax policy | Bundle Ed25519 signature fails → SENTRY refuses to load |
| Post-mission tamper | SQLite ledger row flipped | Hash chain break detected at exact row by `verify-ledger` |
| Post-mission tamper | Whole DB replaced with a forged one | Ledger head hash diverges from the Mission Authority's recorded head on next sync |

## Out of scope for the hackathon
- Hardware attestation of the ESP32 (would require Secure Boot + eFuse keys).
- Defeat of a kernel-level rootkit on the operator laptop.
- Confidentiality of bundle contents (we sign, not encrypt; bundles are operator-readable by design for auditability).
- Replay protection across operators (single-operator demo).
