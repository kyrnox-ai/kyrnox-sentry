import { FileEnterpriseTokenStore, prepareEnterpriseRuntime } from "@kyrnox/enterprise"
import { allowStaleBundle, getControlPlaneUrl } from "./config.js"

export async function prepareCliEnterpriseIntegration(workspacePath = process.cwd()) {
	const controlPlaneUrl = getControlPlaneUrl()
	if (!controlPlaneUrl) return { enabled: false as const }
	return prepareEnterpriseRuntime({
		controlPlaneUrl,
		workspacePath,
		allowStaleBundle: allowStaleBundle(),
		tokenStore: new FileEnterpriseTokenStore(),
	})
}
