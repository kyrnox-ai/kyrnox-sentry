import { createKyrnoxGateway } from "@kyrnox/llms"

export async function runProviderCommand(action = "list", args: string[] = []): Promise<number> {
	const gateway = createKyrnoxGateway()
	if (action === "models") {
		const providerId = args[0]
		console.log(JSON.stringify({ models: gateway.listModels(providerId) }, null, 2))
		return 0
	}
	console.log(JSON.stringify({ providers: gateway.listProviders() }, null, 2))
	return 0
}