import { stat } from "node:fs/promises"
import { getBundlePath, getKyrnoxDataDir, getProviderSettingsPath } from "../utils/config.js"

interface CheckResult {
	name: string
	ok: boolean
	value?: string
	detail?: string
}

const RECOMMENDED_ENV_VARS = ["KYRNOX_DATA_DIR", "KYRNOX_PROVIDER_SETTINGS_PATH", "KYRNOX_BUNDLE_PATH"] as const

export async function runDoctorCommand(args: string[] = []): Promise<number> {
	const json = args.includes("--json")

	const envChecks: CheckResult[] = RECOMMENDED_ENV_VARS.map((key) => ({
		name: key,
		ok: true,
		value: process.env[key],
		detail: process.env[key] ? "set" : "using default",
	}))

	const bundlePath = getBundlePath()
	const bundleCheck: CheckResult = await stat(bundlePath)
		.then(() => ({ name: "bundle file", ok: true, value: bundlePath, detail: "found" }))
		.catch(() => ({ name: "bundle file", ok: true, value: bundlePath, detail: "not present (run will execute without an enterprise bundle)" }))

	const allOk = envChecks.every((c) => c.ok) && bundleCheck.ok

	const report = {
		ok: allOk,
		paths: { dataDir: getKyrnoxDataDir(), providerSettings: getProviderSettingsPath(), bundle: bundlePath },
		env: envChecks,
		bundle: bundleCheck,
	}

	if (json) {
		console.log(JSON.stringify(report, null, 2))
	} else {
		console.log(`Kyrnox SENTRY doctor: ${allOk ? "OK" : "FAIL"}`)
		console.log("")
		console.log("Environment:")
		for (const check of envChecks) {
			const mark = check.ok ? "✓" : "✗"
			const printedValue = check.value ? ` = ${check.value}` : ""
			console.log(`  ${mark} ${check.name}${printedValue}  (${check.detail})`)
		}
		console.log("")
		console.log("Bundle:")
		console.log(`  ${bundleCheck.ok ? "✓" : "✗"} ${bundleCheck.value}  (${bundleCheck.detail})`)
	}
	return allOk ? 0 : 1
}
