# Kyrnox — Agent Context

Kyrnox is an enterprise-controlled coding agent platform. It ships a VS Code extension, a CLI, modular TypeScript runtime packages, and a Go control plane. The control plane serves identity-filtered policy bundles to the clients; clients enforce those policies before every tool call, file edit, MCP call, skill activation, and workflow step.

## Repository layout

```
apps/cli               Kyrnox CLI (TypeScript, headless + interactive)
apps/command-center    Web UI (Vite/TypeScript)
apps/control-plane     Go API — policy bundles, audit, IAM, telemetry
apps/vscode-extension  VS Code extension host (TypeScript)

packages/shared        Contracts, schemas, logging, storage helpers, bundle types
packages/llms          LLM provider adapters (isolated from agent/core)
packages/agents        Stateless agent loop, tool registry, hooks, runtime events
packages/core          Session lifecycle, policy enforcement, prompt assembly, audit, telemetry
packages/enterprise    Keycloak auth, control-plane sync, bundle cache, artifact materialization
packages/rpc           Cross-process runtime transport
packages/scheduler     Scheduled/background workflow support

infra/local            Local compose stack (Postgres, Keycloak, OTel collector)
docs/                  Architecture, security, observability, policy bundle docs
```

## Architecture

### Enterprise runtime flow

1. Host (CLI or VS Code) bootstraps Keycloak OIDC identity.
2. `packages/enterprise` fetches a policy bundle from the control plane using the bearer token.
3. Bundle artifacts materialize into `.kyrnox/enterprise` (workspace) and `~/.kyrnox/enterprise` (global cache).
4. `packages/core` merges instructions using enterprise precedence: **required > remote advisory > user global > workspace**.
5. `packages/core` evaluates tool policy before every command, file edit, browser action, MCP call, hook, workflow, or skill activation.
6. Runtime emits audit events and OpenTelemetry metrics/traces/logs.

### TypeScript package dependency order

```
shared → llms → agents → core → enterprise → rpc/scheduler
                                     ↓
                              apps/cli, apps/vscode-extension
```

### Go control plane (domain-driven)

```
apps/control-plane/
  cmd/server/main.go          entry point
  cmd/migrate/main.go         schema migrations
  internal/config/            typed env config
  internal/lib/auth/          Keycloak JWKS validation, claims extraction
  internal/lib/rbac/          role-based access control
  internal/lib/middleware/    auth, metrics, request ID middleware
  internal/lib/o11y/          OpenTelemetry init
  internal/lib/db/            pgx pool
  internal/domain/policy/     bundle CRUD, resolution, role/group filtering
  internal/domain/audit/      event ingestion, persistence, query
  internal/domain/identity/   Keycloak claim mapping
  internal/domain/telemetry/  telemetry config endpoints
  api/modules.go              domain wiring (Echo)
  migrations/                 SQL schema files
```

## Local development (inside the devcontainer)

The devcontainer has Go 1.23 and Node 22. The repo is mounted at `/workspaces/kyrnox`. Postgres, Keycloak, and otel-collector are reachable by service name on the Docker network.

### First-time setup

```sh
# install Node dependencies
npm install

# download Go modules
cd apps/control-plane && go mod download && cd /workspaces/kyrnox

# run DB migration
cd apps/control-plane && go run ./cmd/migrate && cd /workspaces/kyrnox
```

### Run the control plane

```sh
cd apps/control-plane
go run ./cmd/server
# KYRNOX_DEV_AUTH_ENABLED=true is already set in the devcontainer environment
```

Server listens on `:8080`. Inside the container, env vars point to the compose services:
- `CONTROL_PLANE_DATABASE_URL` → `postgres://kyrnox:kyrnox@postgres:5432/kyrnox?sslmode=disable`
- `KEYCLOAK_ISSUER_URL` → `http://keycloak:8080/realms/kyrnox-dev`
- `KYRNOX_DEV_AUTH_ENABLED` → `true`

### Smoke test

```sh
kyrnox auth dev-login --token dev:user-1:kyrnox-admin:engineering
kyrnox policy status
kyrnox doctor
```

### TypeScript

```sh
npm run typecheck          # type check all packages/apps
npm run test:unit          # vitest unit tests
npm run test:integration   # vitest integration tests (requires running compose stack)
npm run lint               # biome check
npm run lint:fix           # biome check --write
```

### Go

```sh
cd apps/control-plane
go test ./...
go build ./...
```

## Key conventions

### TypeScript

- Formatter/linter: **Biome** (`biome.json` at root). Run `npm run lint:fix` before committing.
- Strict TypeScript. `tsconfig.base.json` at root; each package extends it.
- All remote/external data must be validated with **zod** schemas before runtime use. Never trust bundle data from the network without schema validation.
- Package boundary: each `packages/*` has its own `package.json` and is referenced as a workspace dependency (e.g., `@kyrnox/shared`). Do not reach across package boundaries by file path.
- Config directory: `~/.kyrnox` (not `~/.cline`). Materialized enterprise artifacts live in `.kyrnox/enterprise/`.

### Go

- Domain-driven structure: each domain (`policy`, `audit`, `identity`) has `types.go`, `repository.go`, `service.go`, `router.go`.
- Structured logging with `log/slog`.
- OpenTelemetry for traces/metrics — initialized once in `o11y.InitTelemetry`.
- HTTP framework: **Echo v4**.
- Database: **pgx v5** connection pool.
- Config is loaded via `config.LoadConfig()` from env vars. No config files — all values come from the environment.

### Policy enforcement rules (never bypass)

- `EnforcementMode = "required"` artifacts cannot be disabled by local toggles.
- `EnforcementMode = "deny"` decisions are **fail-closed** — block execution before user approval prompts.
- `alwaysEnabled: true` artifacts must be injected even if the user tries to disable them.
- `promptCapture: "full"` requires `auditEnabled: true` — reject bundles that violate this.

## Testing

| Layer | Command |
|---|---|
| TypeScript unit | `npm run test:unit` |
| TypeScript integration | `npm run test:integration` |
| Go | `cd apps/control-plane && go test ./...` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |

Integration tests in `tests/integration/` require the compose stack to be running.

## Ports (inside devcontainer)

| Service | Internal address | Host port |
|---|---|---|
| Control plane | `localhost:8080` | 8080 |
| Keycloak | `http://keycloak:8080` | 8081 |
| Postgres | `postgres:5432` | 5432 |
| OTel collector (gRPC) | `otel-collector:4317` | 4317 |
| OTel collector (HTTP) | `otel-collector:4318` | 4318 |
| Command center (Vite) | `localhost:5173` | 5173 |

Keycloak admin UI: `http://localhost:8081` — credentials `admin` / `admin`.
