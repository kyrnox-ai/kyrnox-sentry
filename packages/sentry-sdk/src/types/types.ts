export type EnterpriseArtifactKind = "rule" | "workflow" | "skill" | "hook" | "agent"
export type EnterpriseArtifactSource = "local" | "global" | "remote" | "enterprise"
export type EnforcementMode = "advisory" | "required" | "deny"
export type ToolPolicyAction = "allow" | "ask" | "deny"
export type RuntimeHost = "vscode" | "cli" | "rpc"

export interface KeycloakOidcConfig {
	issuerUrl: string
	clientId: string
	scopes: string[]
	audience?: string
	redirectUri?: string
	deviceAuthorizationEndpoint?: string
	tokenEndpoint?: string
	authorizationEndpoint?: string
	jwksUri?: string
}

export interface EnterpriseIdentityClaims {
	subject: string
	email?: string
	preferredUsername?: string
	organizationId?: string
	projectIds?: string[]
	roles: string[]
	groups: string[]
	rawClaims: Record<string, unknown>
}

export interface EnterpriseAccessToken {
	accessToken: string
	idToken?: string
	refreshToken?: string
	expiresAt?: number
	scopes: string[]
	tokenType?: string
}

export interface ManagedInstructionArtifact {
	id: string
	name: string
	kind: EnterpriseArtifactKind
	source: EnterpriseArtifactSource
	contents: string
	description?: string
	alwaysEnabled: boolean
	enforcement: EnforcementMode
	priority: number
	roles?: string[]
	groups?: string[]
	projectIds?: string[]
	metadata?: Record<string, unknown>
}

export interface EnterpriseToolPolicy {
	id?: string
	toolName: string
	action: ToolPolicyAction
	requiresApproval: boolean
	roles?: string[]
	maxRisk?: "low" | "medium" | "high"
	commandAllowlist?: string[]
	commandDenylist?: string[]
	pathAllowlist?: string[]
	pathDenylist?: string[]
	metadata?: Record<string, unknown>
}

export interface EnterpriseTelemetryConfig {
	enabled: boolean
	serviceName: string
	otlpEndpoint?: string
	headers?: Record<string, string>
	promptCapture: "off" | "metadata" | "full"
	metricsEnabled: boolean
	auditEnabled: boolean
	sampleRate?: number
}

export interface EnterprisePolicyBundle {
	id: string
	version: string
	source: "control-plane" | "cache" | "file"
	issuedAt: string
	expiresAt?: string
	claims?: EnterpriseIdentityClaims
	keycloak?: KeycloakOidcConfig
	artifacts: ManagedInstructionArtifact[]
	toolPolicies: EnterpriseToolPolicy[]
	telemetry: EnterpriseTelemetryConfig
	featureFlags: Record<string, boolean>
	metadata?: Record<string, unknown>
}

export interface EnterpriseEnforcementDecision {
	allowed: boolean
	action: ToolPolicyAction
	reason: string
	matchedPolicyIds: string[]
	auditRequired: boolean
	redactions?: Array<{ path: string; reason: string }>
}

export interface EnterpriseAuditEvent {
	id: string
	timestamp: string
	sessionId?: string
	taskId?: string
	host: RuntimeHost
	userSubject?: string
	organizationId?: string
	projectId?: string
	eventType:
		| "auth.login"
		| "auth.logout"
		| "policy.bundle_loaded"
		| "policy.decision"
		| "tool.requested"
		| "tool.approved"
		| "tool.denied"
		| "skill.used"
		| "workflow.used"
		| "rule.activated"
		| "session.started"
		| "session.completed"
		| "telemetry.export_failed"
	severity: "debug" | "info" | "warn" | "error"
	properties: Record<string, unknown>
}
