# Kyrnox SENTRY — terminal recordings

```text
// CLASSIFIED // KYRNOX SENTRY TAPES // ENFORCEMENT: DENY // FAIL-CLOSED
▮ THREE TAPES ▮ SOURCE OF TRUTH: ./packages/sentry-cli ▮ NO SCREENSHOTS
```

The `tapes/` directory holds [VHS](https://github.com/charmbracelet/vhs)
scripts that drive the locally-built `kyrnox-sentry` CLI and write GIFs
to `media/`. Each tape pins:

- the SENTRY palette hexes (matte-black `#05070A`, signal-amber
  `#FFB000`, warning-red `#FF003C`, restricted-cyan `#00E5FF`,
  NATO-green `#39FF14`, gunmetal `#1A1F26`) inlined verbatim from
  `packages/sentry-cli/src/ui/colors.ts`,
- Geist Mono as the type face (with JetBrains Mono / Space Mono as
  documented fallbacks; all OFL),
- a 1200×720 frame at 24 fps with 24 px padding.

## Tapes

| Tape | Drives | Output |
|---|---|---|
| `sign-and-verify.tape`   | `kyrnox-sentry verify --bundle ./bundle.json` then a `status --json` snapshot | `media/sign-and-verify.gif` |
| `tamper-detected.tape`   | `kyrnox-sentry verify --bundle ./tampered-bundle.json` (schema-fail → `BUNDLE INTEGRITY: TAMPERED` → `[  DENIED  ]`) | `media/tamper-detected.gif` |
| `geo-aoi-violation.tape` | `kyrnox-sentry evaluate` for an in-policy `read_file` (ALLOWED) and a denylisted `execute_command` (`[  DENIED  ]`) — the AOI deny path while `GeoAOIPolicy` is a v1 stub (see `STUBS.md`) | `media/geo-aoi-violation.gif` |

## Install VHS

```sh
# macOS
brew install vhs ttyd ffmpeg

# Linux / portable
go install github.com/charmbracelet/vhs@latest
# requires: ttyd, ffmpeg
```

## Re-record locally

```sh
npm install
npm run build --workspace @kyrnox/sentry-cli
vhs tapes/sign-and-verify.tape
vhs tapes/tamper-detected.tape
vhs tapes/geo-aoi-violation.tape
```

The wrapper `tapes/.bin/kyrnox-sentry` resolves the locally-built CLI
without requiring `npm link` or a published artifact; each tape
prepends `tapes/.bin` to `PATH` so the recorded commands look exactly
as an operator would type them.

## Invariant

Every committed GIF MUST reflect the current CLI output. CI re-renders
the three tapes on every push to `main` that touches
`packages/sentry-cli/**`, `tapes/**`, `bundle.json`, or
`tampered-bundle.json`, and fails the build if the rendered GIFs drift
from what is checked in. CI will **never** push back to `main` — drift
is surfaced as a failed check plus an uploaded `tapes-drift` artifact
so the operator can review and open a follow-up PR.

If you change CLI output (banner, colors, decision row format), expect
to re-record locally and commit the new GIFs in the same PR.

Each GIF is bounded to **≤ 1.5 MB**. If a render exceeds the budget,
re-render with a tighter `Set Framerate` / `Set PlaybackSpeed` or
post-process with `gifsicle -O3 --lossy=80 media/<name>.gif -o
media/<name>.gif` (gifsicle is GPL-2.0; we only invoke it as an
external tool, not as a linked dependency).

## What we never record

No SaaS marketing copy, no superlatives, no emoji, no synthetic
"verified by 1,000 ops teams" overlays. Tapes carry the same
mission-brief voice as `docs/demo-script.md`:
`LEDGER TAIL: 0x9f3c…be71`, `BUNDLE INTEGRITY: VERIFIED`,
`OPERATOR: alice@dod.mil`. Every recorded flow renders DENY decisions
as `[  DENIED  ]` in warning-red — a silent pass would break the
fail-closed contract.
