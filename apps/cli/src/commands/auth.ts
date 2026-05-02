import { FileEnterpriseTokenStore, KeycloakAuthService } from "@kyrnox/enterprise"
import { createKyrnoxGateway } from "@kyrnox/llms"
import { getKeycloakConfig, upsertCliProviderConfig } from "../utils/config.js"

export async function runKeycloakAuthCommand(action: string, args: string[] = []): Promise<number> {
	const store = new FileEnterpriseTokenStore()
	const service = new KeycloakAuthService({ config: getKeycloakConfig(), store })
	if (action === "dev-login") {
		const token = valueAfter(args, "--token") ?? args[0] ?? "dev:user-1:kyrnox-admin:engineering"
		await store.save({ accessToken: token, scopes: ["openid", "profile", "email"], tokenType: "Bearer" })
		console.log(JSON.stringify({ authenticated: true, mode: "development", token }, null, 2))
		return 0
	}
	if (action === "provider") {
		const providerId = valueAfter(args, "--provider") ?? args[0] ?? "kyrnox"
		const modelId = valueAfter(args, "--model") ?? valueAfter(args, "--modelid") ?? args[1]
		const apiKey = valueAfter(args, "--api-key") ?? valueAfter(args, "--apikey") ?? process.env.KYRNOX_API_KEY
		const baseUrl = valueAfter(args, "--base-url") ?? valueAfter(args, "--baseurl")
		const gateway = createKyrnoxGateway()
		const manifest = gateway.listProviders().find((provider) => provider.id === providerId)
		if (!manifest) {
			console.error(`Unknown provider: ${providerId}`)
			return 1
		}
		const settings = await upsertCliProviderConfig({ providerId, apiKey, baseUrl, defaultModelId: modelId ?? manifest.defaultModelId })
		console.log(JSON.stringify({ saved: true, providerId, modelId: modelId ?? manifest.defaultModelId, settingsPath: "~/.kyrnox/settings/providers.json", defaultProviderId: settings.defaultProviderId }, null, 2))
		return 0
	}
	if (action === "logout") {
		await service.logout()
		console.log("Logged out of Kyrnox enterprise auth.")
		return 0
	}
	if (action === "status") {
		const session = await service.getSession()
		console.log(JSON.stringify({ authenticated: Boolean(session), claims: session?.claims }, null, 2))
		return 0
	}
	if (action === "device") {
		const flow = service.deviceFlow
		const started = await flow.start()
		console.log(JSON.stringify(started, null, 2))
		return 0
	}
	console.error(`Unknown auth action: ${action}`)
	return 1
}

function valueAfter(args: string[], flag: string): string | undefined {
	const index = args.indexOf(flag)
	return index >= 0 ? args[index + 1] : undefined
}
