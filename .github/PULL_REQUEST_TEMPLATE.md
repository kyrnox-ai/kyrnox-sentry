<!--
// CLASSIFIED // KYRNOX SENTRY // PULL REQUEST
▮ FAIL-CLOSED CONTRACT ▮ FROZEN V1 SDK SURFACE ▮ MISSION-BRIEF VOICE
-->

## ▮ MISSION

<!-- One-line declarative statement. What does this PR do? No marketing copy. -->

## ▮ DIFF SUMMARY

- **Added:**
  <!-- e.g., scripts/render-social-preview.mjs, .github/ISSUE_TEMPLATE/ -->
- **Modified:**
  <!-- e.g., README.md, AGENTS.md, package.json -->
- **Removed:**
  <!-- list, or write `none` -->

## ▮ FAIL-CLOSED CHECK

- [ ] Every new or changed flow preserves the deny path. Missing input,
  malformed schema, signature mismatch, expired bundle, and explicit
  deny rules all still collapse to `[  DENIED  ]`.
- [ ] No code path silently upgrades a DENIED decision to ALLOWED.
- [ ] `EnforcementMode = "required"` artifacts cannot be disabled by
  local toggles introduced in this PR.

## ▮ V1 SURFACE CHECK

- [ ] `@kyrnox/sentry-sdk` exports are unchanged or net-additive only.
  No existing export signature shifted.
- [ ] New SDK exports (if any) ship with a unit test and a `STUBS.md`
  entry when they introduce a new stub.
- [ ] No re-export of platform-only code into the OSS surface.

## ▮ QUALITY GATE

- [ ] `npm run typecheck` is green.
- [ ] `npm run test:unit` is green.
- [ ] `npm run --workspace @kyrnox/sentry-demo build` is green when
  `apps/demo/` was touched.
- [ ] `npm run social-preview` was re-run when
  `scripts/render-social-preview.mjs` or
  `packages/sentry-cli/src/ui/colors.ts` was touched, and the
  re-rendered PNG is committed.
- [ ] VHS tapes were re-rendered locally when CLI output, tape
  scripts, or bundle fixtures changed; drift workflow stays green.
- [ ] No new biome regressions on changed files (`npm run lint` on
  main has pre-existing diagnostics in
  `packages/sentry-cli/src/main.ts` only).

## ▮ AESTHETIC CHECK

- [ ] Palette tokens come from
  `packages/sentry-cli/src/ui/colors.ts` byte-for-byte. No new
  colors introduced.
- [ ] Voice is mission-brief and declarative. No emojis. No
  superlatives. No marketing copy.
- [ ] Glyphs are limited to the SENTRY set (`▮ ▶ ✓ ✗ ⚠ →`).
- [ ] WCAG AA contrast is preserved on every new visual surface
  (CLI, TUI, demo, README, social preview, issue forms, PR template,
  SECURITY.md).

## ▮ DOCS

- [ ] `README.md` updated where the user-facing surface changed.
- [ ] `STUBS.md` updated when a new SDK stub or status change lands.
- [ ] `docs/threat-model.md` updated when an adversary or invariant
  changed.
- [ ] `docs/demo-script.md` updated when the demo surface changed.
- [ ] `AGENTS.md` updated when the repository layout changed.

## ▮ NOTES

<!-- Optional. Risk callouts, follow-ups for next branch, screenshots
     of palette-correct rendering. Keep it terse. -->
