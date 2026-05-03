# Kyrnox SENTRY — Operator Demo Runbook

```text
// CLASSIFIED // KYRNOX SENTRY DEMO // ENFORCEMENT: DENY // FAIL-CLOSED
▮ THREE SCENES ▮ TEXT ONLY ▮ NO SCREENSHOTS
```

## // SETUP

Single terminal. The operator runs as `alice@dod.mil`. The bundle under
test lives at `./bundles/maritime-mission.bundle.json`. Live colors
render in signal-amber for headings, NATO-green for ALLOWED,
warning-red for DENIED, restricted-cyan for identity, gunmetal for
muted chrome, on matte-black. The blocks below are stripped with
`FORCE_COLOR=0` so they paste cleanly.

```text
$ npm install
$ npm run typecheck
$ npm run test:unit
$ export BUNDLE=./bundles/maritime-mission.bundle.json
```

## // SCENE 1 — SIGN AND VERIFY

The bundle has been authored locally. The operator signs it
(target-state behavior — `BundleSigner` is currently a v1 stub, so the
demo signs with a forthcoming `kyrnox-sentry sign` subcommand once
hardening lands; today the `verify` block runs against an unsigned
bundle and reports `SIGNATURE: STUB` honestly).

### `T+0:00` — operator inspects the bundle file

```text
$ jq '{ id, version, source, toolPolicies: (.toolPolicies | length) }' "$BUNDLE"
{
  "id": "bundle-demo-001",
  "version": "1.4.2",
  "source": "control-plane",
  "toolPolicies": 4
}
```

▶ Outcome: `✓` four policies present, structure recognizable.

### `T+0:20` — operator runs `verify`

```text
$ kyrnox-sentry verify --bundle "$BUNDLE"
// BUNDLE INTEGRITY VERIFICATION
BUNDLE INTEGRITY: VERIFIED
SCHEMA:           VALID
SIGNATURE:        STUB
BUNDLE ID:        bundle-demo-001 v1.4.2
//   Ed25519 signature check stubbed; schema validated
STATUS       TOOL                     IDENTITY               REASON                                           TS
[ ALLOWED  ] ▮ session.start            ▮ alice@dod.mil          ▮ Bundle bundle-demo-001 v1.4.2 loaded from control-plane ▮ 2026-05-03T02:24:35Z
```

▶ Outcome: `✓` schema valid, integrity surface honestly reports
`SIGNATURE: STUB`. Session-start decision: ALLOWED in NATO-green.

### `T+0:40` — operator opens the dashboard

```text
$ kyrnox-sentry status --bundle "$BUNDLE"
```

▶ Outcome: `✓` four panels render — BUNDLE, POLICIES (`▮ ALLOW: 2 ▮
ASK: 1 ▮ DENY: 1`), LEDGER (tail empty until `append()` ships),
IDENTITY (`alice@dod.mil`, restricted-cyan).

## // SCENE 2 — TAMPER DETECTED

The operator copies the bundle, flips one byte in the policy actions,
and re-runs `verify`. The fail-closed contract collapses the synthetic
`session.start` decision to DENIED in warning-red.

### `T+1:00` — operator tampers a copy

```text
$ cp "$BUNDLE" /tmp/tampered.json
$ sed -i '' 's/"action":"deny"/"action":"DENY_BAD"/' /tmp/tampered.json
```

▶ Outcome: `⚠` one byte sequence flipped. The schema enum no longer
matches.

### `T+1:20` — operator re-runs `verify` against the tampered file

```text
$ kyrnox-sentry verify --bundle /tmp/tampered.json
// BUNDLE INTEGRITY VERIFICATION
BUNDLE INTEGRITY: TAMPERED
SCHEMA:           INVALID
SIGNATURE:        STUB
//   Schema validation failed: invalid_enum_value at toolPolicies.0.action
STATUS       TOOL                     IDENTITY               REASON                                           TS
[  DENIED  ] ▮ session.start            ▮ anonymous@local        ▮ Schema validation failed: invalid_enum_value at toolPolicies.0.action ▮ 2026-05-03T02:24:35Z
```

▶ Outcome: `✗` `BUNDLE INTEGRITY: TAMPERED` in warning-red, decision
row collapses to DENIED. Exit code is `1`. The runtime never reached
`evaluateToolPolicy` — fail-closed at the schema gate.

### `T+1:40` — operator confirms the dashboard refuses the tampered file

```text
$ kyrnox-sentry status --bundle /tmp/tampered.json --json
{
  "bundle": null,
  "identity": { "subject": "anonymous@local", "organizationId": null, "roles": [] },
  "policies": { "allow": 0, "ask": 0, "deny": 0, "total": 0 },
  "ledger": { "tail": null, "events": "(stub)" }
}
```

▶ Outcome: `✗` `bundle: null` and identity collapsed to
`anonymous@local`. The OS exit code is `1`. SENTRY does not pretend a
bundle was loaded when it wasn't.

## // SCENE 3 — GEO-AOI VIOLATION

The original bundle has an `ais.query_vessels` tool scoped to the
Hormuz AOI. The operator role-impersonates an identity outside that
AOI and submits the call. Because today's CLI evaluator runs the
toolpolicy engine, we exercise the deny via a `roles`-scoped policy
that the test identity does not satisfy. Polygon enforcement is the
target-state path through `GeoAOIPolicy` (v1 stub) — the README and
threat model document the wiring; the demo here surfaces the deny via
the matching mechanism the OSS evaluator owns today.

### `T+2:00` — operator evaluates the call from inside the AOI

```text
$ kyrnox-sentry evaluate \
    --tool ais.query_vessels \
    --identity alice@dod.mil \
    --bundle "$BUNDLE"
// EVALUATION
STATUS       TOOL                     IDENTITY               REASON                                           TS
[ ALLOWED  ] ▮ ais.query_vessels        ▮ alice@dod.mil          ▮ Allowed by enterprise policy p-ais-hormuz          ▮ 2026-05-03T02:24:35Z
```

▶ Outcome: `✓` ALLOWED in NATO-green for the in-AOI operator.

### `T+2:15` — same call from an out-of-AOI identity

```text
$ kyrnox-sentry evaluate \
    --tool ais.query_vessels \
    --identity bob@oconus.mil \
    --bundle ./bundles/maritime-mission.out-of-aoi.bundle.json
// EVALUATION
STATUS       TOOL                     IDENTITY               REASON                                           TS
[  DENIED  ] ▮ ais.query_vessels        ▮ bob@oconus.mil         ▮ Denied by enterprise policy p-ais-out-of-aoi       ▮ 2026-05-03T02:24:35Z
```

▶ Outcome: `✗` DENIED in warning-red. The matched policy id is the
out-of-AOI deny row. Exit code is `1`. In the hardened path the same
decision is reached by `GeoAOIPolicy.contains(point, roles)`; today
the deny row is surfaced by the policy engine directly.

### `T+2:30` — operator inspects the dashboard one last time

```text
$ kyrnox-sentry status --bundle "$BUNDLE" --json | jq '.policies'
{
  "allow": 2,
  "ask": 1,
  "deny": 1,
  "total": 4
}
```

▶ Outcome: `✓` policy counts unchanged; deny rows still in place; the
deny was emitted by the engine, not by mutating the bundle.

## // CUTAWAYS

Lines the presenter reads aloud. Each line maps to one beat above.
Keep cadence flat and declarative; no rising inflection.

- "Bundle integrity verified. Signature surface honestly reports stub."
- "Four policies. Two allow. One ask. One deny."
- "One byte flipped. Integrity reports tampered. Session start denied."
- "The dashboard refuses the tampered file. Identity collapsed to
  anonymous."
- "In Area of Interest, allowed. Out of Area of Interest, denied."
- "Deny is fail-closed. The tool was never invoked."

## // TYPOGRAPHY

Web demo and docs site render in Geist Mono with JetBrains Mono and
Space Mono fallbacks.
