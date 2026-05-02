export const KYRNOX_CONFIG_DIR = ".kyrnox"
export const KYRNOX_GLOBAL_CONFIG_DIR = ".kyrnox"

export type JsonObject = Record<string, unknown>

export interface RuntimeContext {
	host: "vscode" | "cli" | "rpc"
	sessionId?: string
	taskId?: string
	workspacePath?: string
}

export * from "./enterprise/index.js"
export * from "./llms/index.js"
