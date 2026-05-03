import { createKyrnoxGateway } from "@kyrnox/sentry-tools"
import { getProviderSettingsPath, getBundlePath, loadCliProviderSettings } from "../utils/config.js"

export async function runConfigCommand(args: string[] = []): Promise<number> {
	const json = args.includes("--json")
	const settings = await loadCliProviderSettings()
	const gateway = createKyrnoxGateway()
	const output = {
		bundlePath: getBundlePath(),
		providerSettingsPath: getProviderSettingsPath(),
		defaultProviderId: settings.defaultProviderId,
		defaultModelId: settings.defaultModelId,
		providers: gateway.listProviders().map((provider) => ({ id: provider.id, name: provider.name, defaultModelId: provider.defaultModelId, apiKeyEnv: provider.apiKeyEnv })),
	}
	if (json) console.log(JSON.stringify(output, null, 2))
	else {
		console.log(`Kyrnox SENTRY config`)
		console.log(`Bundle path: ${output.bundlePath}`)
		console.log(`Provider settings: ${output.providerSettingsPath}`)
		console.log(`Default provider/model: ${output.defaultProviderId}/${output.defaultModelId}`)
		console.log(`Providers: ${output.providers.map((provider) => provider.id).join(", ")}`)
	}
	return 0
}
