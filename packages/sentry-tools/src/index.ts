import type {
	AgentMessage,
	AgentModel,
	AgentModelEvent,
	AgentModelRequest,
	GatewayConfig,
	GatewayModelDefinition,
	GatewayModelSelection,
	GatewayProviderConfig,
	GatewayProviderManifest,
	GatewayProviderRegistration,
	GatewayResolvedModel,
	GatewayResolvedProviderConfig,
	GatewayStreamRequest,
} from "./types.js"

export type { AgentMessage, AgentModel, AgentModelEvent, AgentModelRequest } from "./types.js"

export interface LlmMessage {
	role: "system" | "user" | "assistant" | "tool"
	content: string
}

export interface LlmProvider {
	readonly id: string
	complete(messages: LlmMessage[]): Promise<LlmMessage>
}

const commonCapabilities = ["text", "tools", "reasoning"] as const

function model(providerId: string, id: string, name: string, contextWindow = 128_000): GatewayModelDefinition {
	return { id, name, providerId, contextWindow, capabilities: commonCapabilities }
}

export const KYRNOX_PROVIDER_ID = "kyrnox"
export const KYRNOX_PROVIDER_DEFAULT_BASE_URL = "https://api.kyrnox.ai/api/v1"
export const KYRNOX_PROVIDER_DEFAULT_MODEL = "anthropic/claude-sonnet-4.6"

export const BUILTIN_PROVIDER_REGISTRATIONS: GatewayProviderRegistration[] = [
	{
		manifest: {
			id: KYRNOX_PROVIDER_ID,
			name: "Kyrnox",
			description: "Kyrnox enterprise LLM provider gateway endpoint",
			defaultModelId: KYRNOX_PROVIDER_DEFAULT_MODEL,
			models: [
				model(KYRNOX_PROVIDER_ID, "anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6 via Kyrnox", 200_000),
				model(KYRNOX_PROVIDER_ID, "openai/gpt-5.3-codex", "GPT Codex via Kyrnox", 400_000),
			],
			api: KYRNOX_PROVIDER_DEFAULT_BASE_URL,
			apiKeyEnv: ["KYRNOX_API_KEY"],
			metadata: { family: "openai-compatible", promptCacheStrategy: "anthropic-automatic", enterpriseManaged: true },
		},
		defaults: { baseUrl: KYRNOX_PROVIDER_DEFAULT_BASE_URL, apiKeyEnv: ["KYRNOX_API_KEY"] },
	},
	provider("anthropic", "Anthropic", "Anthropic Claude API", "anthropic", "claude-sonnet-4.6", "Claude Sonnet 4.6", ["ANTHROPIC_API_KEY"]),
	provider("openai-native", "OpenAI", "OpenAI native API", "openai", "gpt-5.3-codex", "GPT Codex", ["OPENAI_API_KEY"]),
	provider("openrouter", "OpenRouter", "OpenRouter model router", "openai-compatible", "anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6", ["OPENROUTER_API_KEY"], "https://openrouter.ai/api/v1"),
	provider("bedrock", "AWS Bedrock", "Amazon Bedrock", "bedrock", "anthropic.claude-sonnet-4-6", "Claude Sonnet 4.6", ["AWS_ACCESS_KEY_ID"]),
	provider("vertex", "Vertex AI", "Google Vertex AI", "vertex", "claude-sonnet-4@20260101", "Claude Sonnet on Vertex", ["GOOGLE_APPLICATION_CREDENTIALS"]),
	provider("gemini", "Gemini", "Google Gemini API", "google", "gemini-2.5-pro", "Gemini 2.5 Pro", ["GEMINI_API_KEY"]),
	provider("deepseek", "DeepSeek", "DeepSeek API", "openai-compatible", "deepseek-chat", "DeepSeek Chat", ["DEEPSEEK_API_KEY"], "https://api.deepseek.com/v1"),
	provider("mistral", "Mistral", "Mistral AI API", "mistral", "mistral-large-latest", "Mistral Large", ["MISTRAL_API_KEY"]),
	provider("requesty", "Requesty", "Requesty provider gateway", "openai-compatible", "anthropic/claude-sonnet-4.6", "Claude Sonnet 4.6", ["REQUESTY_API_KEY"]),
	provider("ollama", "Ollama", "Local Ollama runtime", "local", "llama3.3", "Llama 3.3", [], "http://localhost:11434/v1"),
	provider("lmstudio", "LM Studio", "Local LM Studio runtime", "local", "local-model", "Local model", [], "http://localhost:1234/v1"),
	provider("vscode-lm", "VS Code LM", "VS Code language model provider", "vscode", "vscode-lm", "VS Code selected model", []),
]

function provider(id: string, name: string, description: string, family: NonNullable<GatewayProviderManifest["metadata"]>["family"], defaultModelId: string, defaultModelName: string, apiKeyEnv: readonly string[], baseUrl?: string): GatewayProviderRegistration {
	return {
		manifest: {
			id,
			name,
			description,
			defaultModelId,
			models: [model(id, defaultModelId, defaultModelName)],
			api: baseUrl,
			apiKeyEnv,
			metadata: { family },
		},
		defaults: { baseUrl, apiKeyEnv },
	}
}

class GatewayRegistry {
	readonly #providers = new Map<string, GatewayProviderRegistration>()
	readonly #configs = new Map<string, GatewayResolvedProviderConfig>()

	constructor(config: GatewayConfig = {}) {
		if (config.builtins !== false) {
			const allowed = config.builtins ? new Set(config.builtins) : undefined
			for (const registration of BUILTIN_PROVIDER_REGISTRATIONS) {
				if (!allowed || allowed.has(registration.manifest.id)) this.registerProvider(registration)
			}
		}
		for (const registration of config.providers ?? []) this.registerProvider(registration)
		for (const providerConfig of config.providerConfigs ?? []) this.configureProvider(providerConfig)
	}

	registerProvider(registration: GatewayProviderRegistration): void {
		this.#providers.set(registration.manifest.id, registration)
	}

	configureProvider(config: GatewayProviderConfig): void {
		if (config.enabled === false) return
		if (!this.#providers.has(config.providerId)) {
			this.registerProvider({
				manifest: {
					id: config.providerId,
					name: config.providerId,
					defaultModelId: config.defaultModelId ?? config.models?.[0]?.id ?? "default",
					models: (config.models ?? [{ id: config.defaultModelId ?? "default", name: config.defaultModelId ?? "default" }]).map((entry) => ({ ...entry, providerId: config.providerId })),
				},
			})
		}
		this.#configs.set(config.providerId, { ...config, providerId: config.providerId })
	}

	listProviders(): GatewayProviderManifest[] {
		return [...this.#providers.values()].map((entry) => entry.manifest)
	}

	listModels(providerId?: string): GatewayModelDefinition[] {
		return this.listProviders().flatMap((providerManifest) => (providerId && providerManifest.id !== providerId ? [] : providerManifest.models))
	}

	resolveModel(selection: GatewayModelSelection): GatewayResolvedModel {
		const registration = this.#providers.get(selection.providerId)
		if (!registration) throw new Error(`Unknown Kyrnox LLM provider: ${selection.providerId}`)
		const modelId = selection.modelId ?? registration.manifest.defaultModelId
		const resolvedModel = registration.manifest.models.find((candidate) => candidate.id === modelId) ?? { id: modelId, name: modelId, providerId: registration.manifest.id, capabilities: ["text" as const] }
		return { provider: registration.manifest, model: resolvedModel }
	}

	resolvedConfig(providerId: string): GatewayResolvedProviderConfig {
		const registration = this.#providers.get(providerId)
		if (!registration) throw new Error(`Unknown Kyrnox LLM provider: ${providerId}`)
		return { ...registration.defaults, ...this.#configs.get(providerId), providerId }
	}
}

class GatewayModelAdapter implements AgentModel {
	constructor(private readonly gateway: DefaultKyrnoxGateway, private readonly selection: GatewayModelSelection) {}

	stream(request: AgentModelRequest): Promise<AsyncIterable<AgentModelEvent>> {
		return this.gateway.stream({
			providerId: this.selection.providerId,
			modelId: this.selection.modelId ?? "",
			systemPrompt: request.systemPrompt,
			messages: request.messages,
			tools: request.tools,
			temperature: request.options?.temperature,
			maxTokens: request.options?.maxTokens,
			metadata: request.options?.metadata,
			reasoning: request.options?.reasoning,
			signal: request.signal,
		})
	}
}

export class DefaultKyrnoxGateway {
	readonly #registry: GatewayRegistry

	constructor(config: GatewayConfig = {}) {
		this.#registry = new GatewayRegistry(config)
	}

	registerProvider(registration: GatewayProviderRegistration): this {
		this.#registry.registerProvider(registration)
		return this
	}

	configureProvider(config: GatewayProviderConfig): this {
		this.#registry.configureProvider(config)
		return this
	}

	listProviders(): GatewayProviderManifest[] {
		return this.#registry.listProviders()
	}

	listModels(providerId?: string): GatewayModelDefinition[] {
		return this.#registry.listModels(providerId)
	}

	resolveModel(selection: GatewayModelSelection): GatewayResolvedModel {
		return this.#registry.resolveModel(selection)
	}

	createAgentModel(selection: GatewayModelSelection): AgentModel {
		return new GatewayModelAdapter(this, selection)
	}

	async stream(request: GatewayStreamRequest): Promise<AsyncIterable<AgentModelEvent>> {
		const resolved = this.resolveModel({ providerId: request.providerId, modelId: request.modelId || undefined })
		const config = this.#registry.resolvedConfig(resolved.provider.id)
		return defaultGatewayStream({ ...request, modelId: resolved.model.id }, resolved.provider, config)
	}
}

async function* defaultGatewayStream(request: GatewayStreamRequest, providerManifest: GatewayProviderManifest, config: GatewayResolvedProviderConfig): AsyncIterable<AgentModelEvent> {
	const apiKey = config.apiKey ?? (await config.apiKeyResolver?.())
	const baseUrl = config.baseUrl ?? providerManifest.api
	if (!baseUrl || !apiKey) {
		yield { type: "finish", reason: "error", error: `Provider ${providerManifest.id} is registered but not configured with baseUrl and apiKey` }
		return
	}
	yield { type: "text-delta", text: `Kyrnox gateway request prepared for ${providerManifest.id}/${request.modelId}.` }
	yield { type: "finish", reason: "stop" }
}

export function createKyrnoxGateway(config?: GatewayConfig): DefaultKyrnoxGateway {
	return new DefaultKyrnoxGateway(config)
}

export function createGateway(config?: GatewayConfig): DefaultKyrnoxGateway {
	return createKyrnoxGateway(config)
}
