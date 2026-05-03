# Kyrnox SENTRY

> Open-source SDK, provider tools, and CLI for IAM-governed coding agents and signed policy bundles. Submitted to the **NatSec hackathon** as Kyrnox SENTRY.

[![License: Apache-2.0](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](LICENSE)
[![CI](https://github.com/kyrnox-ai/kyrnox-sentry/actions/workflows/ci.yml/badge.svg)](https://github.com/kyrnox-ai/kyrnox-sentry/actions/workflows/ci.yml)

Kyrnox SENTRY is the **public, Apache-2.0** core of the Kyrnox platform. It ships three packages:

| Package | Description |
|---|---|
| [`@kyrnox/sentry-sdk`](packages/sentry-sdk) | Pure evaluator, signed policy bundles, hash-chained audit ledger, identity-filtered runtime primitives. |
| [`@kyrnox/sentry-tools`](packages/sentry-tools) | Provider gateway adapters and tool wrappers used by SENTRY-governed coding agents. |
| [`@kyrnox/sentry-cli`](packages/sentry-cli) | Open-source `kyrnox-sentry` command-line interface. |

The commercial multi-tenant Kyrnox Platform (control plane, command center, VS Code extension, GCP infra, billing, fleet) lives in the private repo `kyrnox-ai/kyrnox-platform` under BSL 1.1 with `Change Date = 2030-05-02`. It builds on top of `@kyrnox/sentry-sdk`.

The frozen pre-split monorepo lives at `kyrnox-ai/kyrnox-archive` (tag `v0-pre-split`).

## Status

This is an alpha release that publishes the public `@kyrnox/sentry-*` API surface so dependents can pin against it. Several integrity primitives (`BundleSigner`, `HashChainedAuditLedger`, `FirmwareBaselineVerifier`, `GeoAOIPolicy`) ship as **typed stubs** that throw `not yet implemented` until the SENTRY hardening pass lands. See [`STUBS.md`](STUBS.md) for the complete punch-list.

The pure evaluator (`evaluateToolPolicy`), the policy-bundle Zod schema, the file-backed bundle store, the audit-event types, and the prompt-merge precedence are all **fully implemented and unit-tested**.

## Install

```sh
npm install @kyrnox/sentry-sdk
```

## Quick start (SDK)

```ts
import { evaluateToolPolicy, FileBundleStore, KyrnoxRuntime } from "@kyrnox/sentry-sdk"

const bundle = await new FileBundleStore().load()
const runtime = new KyrnoxRuntime(bundle)

await runtime.startSession({
	prompt: "Refactor the auth module",
	host: "cli",
	workspacePath: process.cwd(),
	bundle,
})

// Or directly:
const decision = evaluateToolPolicy({
	bundle,
	toolName: "execute_command",
	command: "rm -rf ./dist",
})
// → { allowed: false, action: "deny", reason: "...", matchedPolicyIds: ["..."], auditRequired: true }
```

## Quick start (CLI)

```sh
npm install -g @kyrnox/sentry-cli
kyrnox-sentry doctor
kyrnox-sentry config
kyrnox-sentry provider list
kyrnox-sentry run "Tell me about my repo"
```

## Repository layout

```
packages/sentry-sdk/    Pure SDK — evaluator, types, schema, audit, prompt merge, integrity stubs
packages/sentry-tools/  Provider gateway and tool wrappers
packages/sentry-cli/    `kyrnox-sentry` CLI
docs/                   Architecture, threat model, demo script, SENTRY plan
```

See [`docs/SENTRY.md`](docs/SENTRY.md), [`docs/architecture.md`](docs/architecture.md), and [`docs/threat-model.md`](docs/threat-model.md) for design context.

## Development

```sh
npm install
npm run typecheck
npm run test:unit
npm run lint
```

Requires Node 22+.

## Licensing

- This repository is licensed under [Apache-2.0](LICENSE).
- The pre-split monorepo (preserved at [`kyrnox-archive`](https://github.com/kyrnox-ai/kyrnox-archive)) was distributed under the MIT License; that history is preserved in this repo's git log per the [NOTICE](NOTICE).
- The commercial Kyrnox Platform is BSL 1.1 with a 4-year Change Date and `Change License = Apache-2.0`.

## Contributing

We welcome issues and pull requests. See [`CONTRIBUTING.md`](CONTRIBUTING.md), [`SECURITY.md`](SECURITY.md), and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

## Roadmap

The SENTRY hardening pass (signing, hash-chained ledger, firmware baseline, geo AOI) is tracked in [`STUBS.md`](STUBS.md) and [`docs/SENTRY.md`](docs/SENTRY.md).
