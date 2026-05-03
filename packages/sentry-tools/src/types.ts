/**
 * Self-contained type surface for the Kyrnox SENTRY tools provider gateway.
 *
 * These types were inlined from the pre-split `@kyrnox/shared` package
 * (see git tag `v0-pre-split`) so that `@kyrnox/sentry-tools` can be
 * published independently of the platform-only types.
 */

export type ModelCapability = "text" | "tools" | "vision" | "reasoning"

export interface GatewayModelDefinition {
	id: string
	name: string
	providerId: string
	contextWindow?: number
	capabilities?: readonly ModelCapability[]
}

export interface GatewayProviderManifest {
	id: string
	name: string
	description?: string
	defaultModelId: string
	models: GatewayModelDefinition[]
	api?: string
	apiKeyEnv?: readonly string[]
	metadata?: { family?: "anthropic" | "openai" | "openai-compatible" | "bedrock" | "vertex" | "google" | "mistral" | "local" | "vscode"; promptCacheStrategy?: string; enterpriseManaged?: boolean }
}

export interface GatewayProviderRegistration {
	manifest: GatewayProviderManifest
	defaults?: { baseUrl?: string; apiKeyEnv?: readonly string[] }
}

export interface GatewayProviderConfig {
	providerId: string
	enabled?: boolean
	apiKey?: string
	apiKeyResolver?: () => Promise<string | undefined>
	baseUrl?: string
	defaultModelId?: string
	models?: Array<{ id: string; name: string; contextWindow?: number; capabilities?: readonly ModelCapability[] }>
}

export interface GatewayResolvedProviderConfig extends GatewayProviderConfig {
	providerId: string
}

export interface GatewayConfig {
	builtins?: false | string[]
	providers?: GatewayProviderRegistration[]
	providerConfigs?: GatewayProviderConfig[]
}

export interface GatewayModelSelection {
	providerId: string
	modelId?: string
}

export interface GatewayResolvedModel {
	provider: GatewayProviderManifest
	model: GatewayModelDefinition
}

export interface AgentMessage {
	role: "system" | "user" | "assistant" | "tool"
	content: string
}

export interface AgentModelEvent {
	type: "text-delta" | "tool-call" | "finish"
	text?: string
	reason?: "stop" | "length" | "error" | "tool"
	error?: string
}

export interface AgentModelRequest {
	systemPrompt?: string
	messages: AgentMessage[]
	tools?: unknown[]
	signal?: AbortSignal
	options?: { temperature?: number; maxTokens?: number; metadata?: Record<string, unknown>; reasoning?: unknown }
}

export interface AgentModel {
	stream(request: AgentModelRequest): Promise<AsyncIterable<AgentModelEvent>>
}

export interface GatewayStreamRequest {
	providerId: string
	modelId: string
	systemPrompt?: string
	messages: AgentMessage[]
	tools?: unknown[]
	temperature?: number
	maxTokens?: number
	metadata?: Record<string, unknown>
	reasoning?: unknown
	signal?: AbortSignal
}
