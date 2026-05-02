# 60-second demo script

Single terminal. ink TUI split-pane visible throughout: left = agent transcript, right = live policy decisions + last 5 ledger rows.

| t (s) | Spoken | On screen |
|---|---|---|
| 0–4 | "Operator on the tactical edge launches a signed mission bundle." | `kyrnox sentry run --bundle bundles/maritime-mission.bundle.json` |
| 4–8 | "Bundle signature verifies. Firmware baseline verifies." | Two ✅ banners |
| 8–18 | "Codex builds the AIS sensor firmware via PlatformIO MCP. Allowed. Logged." | Agent: *"build the mission firmware"* → `pio.build_project` → ✅ ; ledger row appended |
| 18–28 | "Now a prompt-injection makes the agent try to install an unapproved library — dependency confusion. SENTRY denies." | Agent: *"install AIS_Decoder@2.0.1"* → `pio.install_library` → ❌ DENIED (off-allowlist) |
| 28–40 | "Out-of-band, an adversary tampers a built library file. The agent retries the build. SENTRY's firmware baseline detects the mismatch and blocks the flash." | Red-team script flips a byte in `.pio/libdeps/.../AISParser.cpp`; agent: *"rebuild and flash"* → `pio.build_project` → ✅ build, but `FirmwareBaselineVerifier` ❌ TAMPER ALERT; flash aborted |
| 40–48 | "The agent tries to upload to the wrong port. The bundle pins the device. Denied." | Agent: `pio.upload_firmware --port /dev/ttyUSB1` → ❌ DENIED (arg allowlist) |
| 48–54 | "We verify the audit ledger. The hash chain is intact." | `kyrnox sentry verify-ledger` → ✅ |
| 54–58 | "We tamper one row of the audit DB. Re-verify. The break is detected at exactly that row." | `sqlite3 ... 'UPDATE ... WHERE index=3'` ; `kyrnox sentry verify-ledger` → ❌ break at index 3 |
| 58–60 | Tagline | *"Trust, but cryptographically verify, every AI action at the edge."* |

## Pre-demo checklist
- [ ] `./scripts/prewarm-platformio.sh` has been run on the demo machine.
- [ ] `OPENAI_API_KEY` is set; `gpt-4o-mini` reachable.
- [ ] Wokwi mission-pod open in a browser tab (cherry on top — visible LED change after a successful flash).
- [ ] Demo terminal font size bumped to 18pt.
- [ ] OBS / Loom configured to record 1280x720 at 30fps.
- [ ] `npm run demo` runs cleanly twice in a row from a clean checkout.
