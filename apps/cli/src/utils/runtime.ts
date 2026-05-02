import { getControlPlaneUrl } from "./config.js"
import { FileEnterpriseTokenStore } from "@kyrnox/enterprise"

export async function sendRuntimeHeartbeat(fetchImpl: typeof fetch = fetch): Promise<void> {
	const controlPlaneUrl = getControlPlaneUrl()
	if (!controlPlaneUrl) return
	const token = await new FileEnterpriseTokenStore().load()
	if (!token) return
	const response = await fetchImpl(new URL("/v1/runtime/clients/heartbeat", controlPlaneUrl), {
		method: "POST",
		headers: { authorization: `Bearer ${token.accessToken}`, "content-type": "application/json" },
		body: JSON.stringify({ id: `cli:${process.cwd()}`, host: "cli", version: "0.1.0", workspacePath: process.cwd() }),
	})
	if (!response.ok) throw new Error(`Failed to send Kyrnox runtime heartbeat: ${response.status}`)
}