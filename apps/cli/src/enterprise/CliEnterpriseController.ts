import { prepareCliEnterpriseIntegration } from "../utils/enterprise.js"

export class CliEnterpriseController {
	async prepare(workspacePath = process.cwd()) {
		return prepareCliEnterpriseIntegration(workspacePath)
	}
}
