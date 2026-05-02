import { EnterprisePolicyEngine } from "@kyrnox/core"
import { EnterpriseSyncService, FileEnterpriseBundleStore, FileEnterpriseTokenStore } from "@kyrnox/enterprise"
import { allowStaleBundle, getControlPlaneUrl } from "../utils/config.js"

export async function runPolicyCommand(action: string, args: string[]): Promise<number> {
	const store = new FileEnterpriseBundleStore()
	const bundle = await store.load()
	if (action === "status") {
		console.log(JSON.stringify({ loaded: Boolean(bundle), id: bundle?.id, version: bundle?.version, artifacts: bundle?.artifacts.length ?? 0 }, null, 2))
		return 0
	}
	if (action === "sync") {
		const controlPlaneUrl = getControlPlaneUrl()
		if (!controlPlaneUrl) {
			console.error("KYRNOX_CONTROL_PLANE_URL is required for policy sync")
			return 1
		}
		const sync = await new EnterpriseSyncService({
			controlPlaneUrl,
			workspacePath: process.cwd(),
			allowStaleBundle: allowStaleBundle(),
			tokenStore: new FileEnterpriseTokenStore(),
			bundleStore: store,
		}).sync()
		console.log(JSON.stringify({ synced: Boolean(sync), bundleSource: sync?.bundleSource, version: sync?.bundle.version, writtenFiles: sync?.materialization.writtenFiles.length ?? 0 }, null, 2))
		return sync ? 0 : 1
	}
	if (action === "explain") {
		const [toolName = "execute_command", command = ""] = args
		const decision = new EnterprisePolicyEngine(bundle, bundle?.claims).evaluateTool({ toolName, command })
		console.log(JSON.stringify(decision, null, 2))
		return decision.action === "deny" ? 2 : 0
	}
	console.error(`Unknown policy action: ${action}`)
	return 1
}
