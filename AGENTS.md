# Kyrnox SENTRY — Agent Context

This repository is the **public, Apache-2.0** OSS continuation of the pre-split Kyrnox monorepo. It publishes three packages on npm under the `@kyrnox/sentry-*` scope and is the dependency target for the private commercial repo `kyrnox-ai/kyrnox-platform`.

## Repository layout

```
packages/sentry-sdk     @kyrnox/sentry-sdk   — pure evaluator, types, schema, audit, prompt merge, integrity stubs
packages/sentry-tools   @kyrnox/sentry-tools — provider gateway adapters and tool wrappers
packages/sentry-cli     @kyrnox/sentry-cli   — `kyrnox-sentry` CLI (binary)

apps/demo               @kyrnox/sentry-demo  — Vite + React ops-console deployed to GitHub Pages (private workspace, not published)

docs/                   architecture, threat model, demo script, SENTRY hardening plan
.github/workflows/      CI (typecheck/test/lint), Release (npm publish on `sentry-v*` tag), Pages (web demo deploy)
```

## TypeScript package boundary

```
sentry-sdk → sentry-tools → sentry-cli
```

- `sentry-tools` is self-contained (it inlines its gateway types so it can be published independently).
- `sentry-cli` depends on `@kyrnox/sentry-sdk` and `@kyrnox/sentry-tools` only.
- Cross-package imports use the workspace name (`@kyrnox/sentry-sdk`), never relative file paths.

## Key conventions

- Strict TypeScript; Biome formatter (`npm run lint:fix`).
- All remote/external data is validated with **zod** schemas before runtime use.
- Stable v1 API: every export from `@kyrnox/sentry-sdk` keeps its signature through the SENTRY hardening pass. See `STUBS.md`.
- `EnforcementMode = "deny"` decisions in `evaluateToolPolicy` must remain **fail-closed**.

## What does NOT live here

These ship in the private `kyrnox-ai/kyrnox-platform` repo:

- Multi-tenant Go control plane (`apps/control-plane/`).
- Keycloak OIDC integration, JWKS, device-code login.
- VS Code extension host, command-center web UI, GCP infra/CI.
- Hackathon demo apps and `vendor/platformio-mcp/`.

## Commands

```sh
npm install
npm run typecheck
npm run test:unit
npm run lint
npm run build
```

Node 22+. Tests use vitest with TS path aliases that map `@kyrnox/sentry-sdk` and `@kyrnox/sentry-tools` to their workspace `src/index.ts`.
