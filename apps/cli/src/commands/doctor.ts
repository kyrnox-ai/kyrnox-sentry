import { getControlPlaneUrl, getKeycloakConfig, allowStaleBundle, getKyrnoxDataDir, getProviderSettingsPath } from "../utils/config.js"
import { prepareCliEnterpriseIntegration } from "../utils/enterprise.js"

interface CheckResult {
	name: string
	ok: boolean
	value?: string
	detail?: string
}

const REQUIRED_ENV_VARS = ["KYRNOX_CONTROL_PLANE_URL", "KEYCLOAK_ISSUER_URL", "KEYCLOAK_CLI_CLIENT_ID"] as const
const RECOMMENDED_ENV_VARS = ["KYRNOX_ALLOW_STALE_BUNDLE", "KEYCLOAK_SCOPES"] as const
const OPTIONAL_ENV_VARS = ["KYRNOX_DATA_DIR", "KYRNOX_PROVIDER_SETTINGS_PATH", "KYRNOX_API_KEY", "KYRNOX_OTLP_ENDPOINT", "KYRNOX_PROMPT_CAPTURE"] as const

export async function runDoctorCommand(args: string[] = []): Promise<number> {
	const json = args.includes("--json")
	const skipNetwork = args.includes("--no-network") || args.includes("--offline")

	const envChecks: CheckResult[] = []
	for (const key of REQUIRED_ENV_VARS) {
		const value = process.env[key]
		envChecks.push({
			name: key,
			ok: Boolean(value && value.length > 0),
			value,
			detail: value ? "set" : "REQUIRED -- not set",
		})
	}
	for (const key of RECOMMENDED_ENV_VARS) {
		const value = process.env[key]
		envChecks.push({
			name: key,
			ok: true,
			value,
			detail: value ? "set" : "using default",
		})
	}
	for (const key of OPTIONAL_ENV_VARS) {
		const value = process.env[key]
		envChecks.push({
			name: key,
			ok: true,
			value,
			detail: value ? "set" : "unset (optional)",
		})
	}

	const controlPlaneUrl = getControlPlaneUrl()
	const keycloak = getKeycloakConfig()
	const networkChecks: CheckResult[] = []

	if (!skipNetwork) {
		networkChecks.push(await pingControlPlane(controlPlaneUrl))
		networkChecks.push(await pingKeycloak(keycloak.issuerUrl))
	}

	let enterpriseSummary: unknown = { skipped: true, reason: "KYRNOX_CONTROL_PLANE_URL not set" }
	if (controlPlaneUrl) {
		try {
			enterpriseSummary = await prepareCliEnterpriseIntegration()
		} catch (error) {
			enterpriseSummary = { error: error instanceof Error ? error.message : String(error) }
		}
	}

	const allOk = envChecks.every((check) => check.ok) && networkChecks.every((check) => check.ok)

	const report = {
		ok: allOk,
		controlPlaneUrl: controlPlaneUrl ?? null,
		keycloak: { issuerUrl: keycloak.issuerUrl, clientId: keycloak.clientId, scopes: keycloak.scopes },
		paths: { dataDir: getKyrnoxDataDir(), providerSettings: getProviderSettingsPath() },
		flags: { allowStaleBundle: allowStaleBundle() },
		env: envChecks,
		network: skipNetwork ? "skipped" : networkChecks,
		enterprise: enterpriseSummary,
	}

	if (json) {
		console.log(JSON.stringify(report, null, 2))
	} else {
		printHumanReport(report, envChecks, networkChecks, skipNetwork)
	}
	return allOk ? 0 : 1
}

async function pingControlPlane(url: string | undefined): Promise<CheckResult> {
	if (!url) {
		return { name: "control-plane reachability", ok: false, detail: "KYRNOX_CONTROL_PLANE_URL not set" }
	}
	try {
		const response = await fetchWithTimeout(new URL("/healthz", url), 5_000)
		return {
			name: "control-plane reachability",
			ok: response.ok,
			value: url,
			detail: `${response.status} ${response.statusText}`,
		}
	} catch (error) {
		return { name: "control-plane reachability", ok: false, value: url, detail: error instanceof Error ? error.message : String(error) }
	}
}

async function pingKeycloak(issuerUrl: string): Promise<CheckResult> {
	const target = new URL(".well-known/openid-configuration", issuerUrl.endsWith("/") ? issuerUrl : `${issuerUrl}/`)
	try {
		const response = await fetchWithTimeout(target, 5_000)
		return {
			name: "keycloak reachability",
			ok: response.ok,
			value: issuerUrl,
			detail: `${response.status} ${response.statusText}`,
		}
	} catch (error) {
		return { name: "keycloak reachability", ok: false, value: issuerUrl, detail: error instanceof Error ? error.message : String(error) }
	}
}

async function fetchWithTimeout(url: URL, timeoutMs: number): Promise<Response> {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort(), timeoutMs)
	try {
		return await fetch(url, { signal: controller.signal })
	} finally {
		clearTimeout(timer)
	}
}

function printHumanReport(report: { ok: boolean }, envChecks: CheckResult[], networkChecks: CheckResult[], skipNetwork: boolean): void {
	console.log(`Kyrnox doctor: ${report.ok ? "OK" : "FAIL"}`)
	console.log("")
	console.log("Environment:")
	for (const check of envChecks) {
		const mark = check.ok ? "✓" : "✗"
		const printedValue = check.value ? ` = ${check.value}` : ""
		console.log(`  ${mark} ${check.name}${printedValue}  (${check.detail})`)
	}
	console.log("")
	console.log("Reachability:")
	if (skipNetwork) {
		console.log("  - skipped (--no-network)")
	} else {
		for (const check of networkChecks) {
			const mark = check.ok ? "✓" : "✗"
			console.log(`  ${mark} ${check.name}  (${check.detail})`)
		}
	}
}
