# Kyrnox Architecture

Kyrnox follows the layered SDK model from `../clone/sdk-wip/ARCHITECTURE.md` and the Go domain-driven backend style from `../clone/core-platform/docs/architecture.md`.

## TypeScript layers

- `packages/shared`: contracts, schemas, logging, storage helpers, and enterprise bundle types.
- `packages/llms`: provider-specific LLM adapters isolated from agent/core concerns.
- `packages/agents`: stateless agent loop, tool registry, hooks, and runtime events.
- `packages/core`: session lifecycle, prompt assembly, policy enforcement, audit, telemetry, and host-independent orchestration.
- `packages/enterprise`: Keycloak auth, token storage, control-plane sync, bundle cache, and artifact materialization.
- `packages/rpc`: editor/CLI/runtime transport primitives.
- `packages/scheduler`: scheduled/background workflow support.

## Host apps

- `apps/cli` runs headless and interactive tasks with the same enterprise runtime as VS Code.
- `apps/vscode-extension` adapts Cline-style extension activation, webview, commands, and approvals with Kyrnox policy enforcement.
- `apps/control-plane` serves identity-filtered bundles, accepts audit events, and exposes telemetry metadata.

## Enterprise runtime flow

1. Host bootstraps Keycloak identity.
2. Enterprise package fetches and validates a policy bundle.
3. Bundle artifacts materialize into `.kyrnox/enterprise` and cache under `~/.kyrnox/enterprise`.
4. Core merges instructions using enterprise precedence.
5. Core evaluates tool policy before every command, file edit, browser action, MCP call, hook, workflow, or skill activation.
6. Runtime emits audit events and OpenTelemetry metrics/traces/logs.
