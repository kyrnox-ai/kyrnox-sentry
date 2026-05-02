import { mkdir, readFile, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, join } from "node:path"
import type { GatewayProviderConfig, KeycloakOidcConfig } from "@kyrnox/shared"

export function getControlPlaneUrl(): string | undefined {
	return process.env.KYRNOX_CONTROL_PLANE_URL
}

export function getKeycloakConfig(): KeycloakOidcConfig {
	return {
		issuerUrl: process.env.KEYCLOAK_ISSUER_URL ?? "http://localhost:8081/realms/kyrnox-dev",
		clientId: process.env.KEYCLOAK_CLI_CLIENT_ID ?? "kyrnox-cli",
		scopes: (process.env.KEYCLOAK_SCOPES ?? "openid profile email").split(/\s+/).filter(Boolean),
	}
}

export function allowStaleBundle(): boolean {
	return process.env.KYRNOX_ALLOW_STALE_BUNDLE === "true"
}

export interface CliProviderSettings {
	providers: GatewayProviderConfig[]
	defaultProviderId: string
	defaultModelId: string
}

export function getKyrnoxDataDir(): string {
	return process.env.KYRNOX_DATA_DIR ?? join(homedir(), ".kyrnox")
}

export function getProviderSettingsPath(): string {
	return process.env.KYRNOX_PROVIDER_SETTINGS_PATH ?? join(getKyrnoxDataDir(), "settings", "providers.json")
}

export async function loadCliProviderSettings(): Promise<CliProviderSettings> {
	try {
		return JSON.parse(await readFile(getProviderSettingsPath(), "utf8")) as CliProviderSettings
	} catch (error) {
		if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") {
			return { providers: [], defaultProviderId: "kyrnox", defaultModelId: "anthropic/claude-sonnet-4.6" }
		}
		throw error
	}
}

export async function saveCliProviderSettings(settings: CliProviderSettings): Promise<void> {
	const path = getProviderSettingsPath()
	await mkdir(dirname(path), { recursive: true, mode: 0o700 })
	await writeFile(path, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 })
}

export async function upsertCliProviderConfig(config: GatewayProviderConfig): Promise<CliProviderSettings> {
	const settings = await loadCliProviderSettings()
	const providers = settings.providers.filter((provider) => provider.providerId !== config.providerId)
	providers.push(config)
	const next = {
		...settings,
		providers,
		defaultProviderId: config.providerId,
		defaultModelId: config.defaultModelId ?? settings.defaultModelId,
	}
	await saveCliProviderSettings(next)
	return next
}
