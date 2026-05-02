# Kyrnox

Kyrnox is an enterprise-controlled coding agent platform inspired by Cline. It provides a VS Code extension, CLI, modular TypeScript runtime packages, and a Go control plane for centrally enforced rules, workflows, skills, hooks, tool policies, audit events, and observability.

## Goals

- Preserve useful Cline-like coding workflows across VS Code and CLI.
- Enforce enterprise-managed rules, workflows, skills, hooks, and tool policies.
- Use Keycloak OIDC/JWT claims for IAM-aware policy selection and runtime authorization.
- Emit OpenTelemetry metrics/traces/logs and structured audit events with redaction controls.
- Keep `/Users/tonyloehr/Desktop/Workspace/clone` read-only and selectively adapt code into this repository.

## Repository layout

```text
apps/cli              Kyrnox command-line application
apps/vscode-extension VS Code extension host
apps/control-plane    Go API for policy bundles, audit ingestion, IAM, and telemetry metadata
packages/shared       Shared contracts, schemas, and low-level utilities
packages/llms         LLM provider boundaries
packages/agents       Stateless agent loop and tool orchestration
packages/core         Stateful sessions, policy enforcement, instructions, audit, telemetry
packages/enterprise   Keycloak, control-plane sync, bundle cache, and materialization
packages/rpc          Cross-process runtime transport
packages/scheduler    Scheduled/background workflow scaffold
infra/local           Local Keycloak/Postgres/OTel development stack
docs                  Architecture, security, policy, and observability documentation
```

## Local development

```sh
npm install
npm run typecheck
npm run test
cd apps/control-plane && go test ./...
```

Start local dependencies:

```sh
docker compose -f infra/local/compose.yml up -d
```

Run the local control plane with development bearer-token auth explicitly enabled:

```sh
cd apps/control-plane
go run ./cmd/migrate
KYRNOX_DEV_AUTH_ENABLED=true go run ./cmd/server
```

## Enterprise policy precedence

Kyrnox resolves instructions with this precedence:

1. Enterprise required artifacts
2. Remote enterprise advisory artifacts
3. User global configuration
4. Workspace configuration

Mandatory enterprise artifacts and denied tool policies are enforced in both the CLI and VS Code extension and cannot be disabled by local toggles.

## Deploying

- Local stack: [`docs/local-development.md`](docs/local-development.md).
- Shared GCP control plane (GKE + Cloud SQL + Keycloak): [`docs/deployment-gcp.md`](docs/deployment-gcp.md).
- End-to-end team rollout (provision → onboard developers → publish first enterprise policy bundle → verify enforcement): [`docs/handoff-deployment.md`](docs/handoff-deployment.md).
