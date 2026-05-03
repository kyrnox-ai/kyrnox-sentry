# Kyrnox SENTRY — Security Policy

```text
// CLASSIFIED // KYRNOX SENTRY SECURITY POLICY // FAIL-CLOSED
▮ APACHE-2.0 ▮ DENY-BY-DEFAULT ▮ TAMPER-EVIDENT
```

## // SCOPE

This policy covers **only this OSS repository** —
`kyrnox-ai/kyrnox-sentry` — and the three packages it publishes to
npm:

- `@kyrnox/sentry-sdk` (`packages/sentry-sdk`)
- `@kyrnox/sentry-tools` (`packages/sentry-tools`)
- `@kyrnox/sentry-cli` (`packages/sentry-cli`)

It also covers the public CI workflows under `.github/workflows/`
(CI, Pages, Tapes, Social-preview), the demo console at `apps/demo/`,
and the threat-model / hardening docs under `docs/`.

It does **not** cover the private commercial repo
`kyrnox-ai/kyrnox-platform`. Multi-tenant control-plane,
Keycloak / OIDC integration, command-center web UI, VS Code extension
host, and GCP infrastructure ship there under BSL 1.1 and have their
own private vulnerability process. Vulnerabilities that affect both
surfaces should be disclosed through the platform process; the OSS
maintainers will be looped in for the SDK / CLI side.

## // SUPPORTED VERSIONS

| Track            | Status            | Security patches |
|------------------|-------------------|------------------|
| `@kyrnox/sentry-* 1.x` (active) | Supported | ▶ Yes |
| Pre-`1.0.0` alphas              | Best-effort | ⚠ Best-effort, not guaranteed |
| Pre-split `kyrnox-archive`      | Archived  | ✗ No — read-only mirror at `v0-pre-split` |

Only the latest minor of the active `1.x` line receives security
patches. Older minors get back-ports only when the fix is a one-line
isolated change.

## // HOW TO REPORT

Email **`security@kyrnox.ai`** with:

- a one-line declarative title (mission-brief voice — see SECURITY
  reports in `docs/threat-model.md`);
- the affected component (`sdk` / `tools` / `cli` / `demo` / `docs`);
- the affected version(s) and commit SHA;
- a redacted reproduction (no real policy bundle keys, audit-ledger
  rows, or attested firmware hashes);
- any adversary mapping you can offer against the four primary
  adversaries enumerated in
  [`docs/threat-model.md`](docs/threat-model.md#-adversaries).

GPG and Signal contact info are tracked alongside
[`docs/threat-model.md`](docs/threat-model.md). If you need an
encrypted channel and the document does not yet pin a fingerprint,
state that in the first email and the maintainers will hand off keys
out-of-band before any sensitive material is exchanged. **TODO** for
maintainers: pin a stable PGP fingerprint or Signal handle in
`docs/threat-model.md` once the disclosure mailbox is wired.

Please do **not** open a public GitHub issue for vulnerabilities, and
do not attach real bundles or ledger rows to the bug-report form.

## // ACKNOWLEDGEMENT AND DISCLOSURE WINDOW

- Acknowledgement of receipt: within **2 business days**.
- Triage to confirmed / declined: within **10 business days**.
- Coordinated disclosure window: **90 days** from the acknowledged
  report. Shorter when the exploit is already public, when active
  exploitation is observed in the wild, or when the issue is judged
  trivially weaponizable against the fail-closed contract. Longer is
  possible by mutual agreement when a fix requires a coordinated
  release across `kyrnox-sentry` and `kyrnox-platform`.
- Reporters who follow this process are credited in the release notes
  unless they ask to remain anonymous.

## // OUT OF SCOPE

The following are **not** treated as vulnerabilities here:

- Denial-of-service via local resource exhaustion against the CLI or
  the apps/demo console (for example, oversized bundle JSON that
  crashes the local Node process). The fail-closed contract still
  holds — the tool is not invoked.
- Social engineering of GitHub maintainers, npm publishers, or
  release-tagging humans.
- OSS dependencies whose CVE chain is already public on the
  upstream tracker; report those upstream first and open a routine
  bump PR here.
- Stylistic concerns about the SENTRY palette, the mission-brief
  voice, or the terminal aesthetic.
- Rendering glitches in the apps/demo browser console that do not
  affect a decision (`[  DENIED  ]` still wins).

## // STUBS ARE NOT VULNERABILITIES

Four v1 SDK primitives are documented as **typed stubs** in
[`STUBS.md`](STUBS.md):

- `BundleSigner` (Ed25519 sign / verify)
- `HashChainedAuditLedger` (append-only SHA-256 chain)
- `FirmwareBaselineVerifier` (digest-equality against a signed
  baseline)
- `GeoAOIPolicy` (point-in-polygon AOI, with optional role filtering)

Their signatures are frozen for v1; their hardening lands in the
SENTRY hardening pass. The CLI surfaces this honestly — the `verify`
command prints `SIGNATURE: STUB` until `BundleSigner.verify` lands —
so "stubbed" is not a vulnerability. Reports that boil down to "the
stub does not enforce yet" will be redirected to `STUBS.md` and the
threat-model hardening section.

What **is** a vulnerability against the stubs:

- A code path that allows a stub to upgrade a `[  DENIED  ]` decision
  to `[ ALLOWED  ]`.
- A code path that swallows a stub error silently instead of
  collapsing to deny.
- An export signature change on a v1-stable symbol without a
  `BREAKING CHANGE` marker and a minor bump.

Those reports go through the email above.
