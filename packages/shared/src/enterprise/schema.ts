import { z } from "zod"

export const EnterpriseArtifactKindSchema = z.enum(["rule", "workflow", "skill", "hook", "agent"])
export const EnterpriseArtifactSourceSchema = z.enum(["local", "global", "remote", "enterprise"])
export const EnforcementModeSchema = z.enum(["advisory", "required", "deny"])
export const ToolPolicyActionSchema = z.enum(["allow", "ask", "deny"])
export const RuntimeHostSchema = z.enum(["vscode", "cli", "rpc"])

export const KeycloakOidcConfigSchema = z.object({
	issuerUrl: z.string().url(),
	clientId: z.string().min(1),
	scopes: z.array(z.string().min(1)).min(1),
	audience: z.string().min(1).optional(),
	redirectUri: z.string().url().optional(),
	deviceAuthorizationEndpoint: z.string().url().optional(),
	tokenEndpoint: z.string().url().optional(),
	authorizationEndpoint: z.string().url().optional(),
	jwksUri: z.string().url().optional(),
})

export const EnterpriseIdentityClaimsSchema = z.object({
	subject: z.string().min(1),
	email: z.string().email().optional(),
	preferredUsername: z.string().optional(),
	organizationId: z.string().optional(),
	projectIds: z.array(z.string().min(1)).optional(),
	roles: z.array(z.string().min(1)),
	groups: z.array(z.string().min(1)),
	rawClaims: z.record(z.unknown()),
})

export const EnterpriseAccessTokenSchema = z.object({
	accessToken: z.string().min(1),
	idToken: z.string().min(1).optional(),
	refreshToken: z.string().min(1).optional(),
	expiresAt: z.number().int().positive().optional(),
	scopes: z.array(z.string().min(1)),
	tokenType: z.string().optional(),
})

export const ManagedInstructionArtifactSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1),
	kind: EnterpriseArtifactKindSchema,
	source: EnterpriseArtifactSourceSchema.default("enterprise"),
	contents: z.string().min(1),
	description: z.string().optional(),
	alwaysEnabled: z.boolean(),
	enforcement: EnforcementModeSchema,
	priority: z.number().int(),
	roles: z.array(z.string().min(1)).optional(),
	groups: z.array(z.string().min(1)).optional(),
	projectIds: z.array(z.string().min(1)).optional(),
	metadata: z.record(z.unknown()).optional(),
})

export const EnterpriseToolPolicySchema = z.object({
	id: z.string().min(1).optional(),
	toolName: z.string().min(1),
	action: ToolPolicyActionSchema,
	requiresApproval: z.boolean(),
	roles: z.array(z.string().min(1)).optional(),
	maxRisk: z.enum(["low", "medium", "high"]).optional(),
	commandAllowlist: z.array(z.string().min(1)).optional(),
	commandDenylist: z.array(z.string().min(1)).optional(),
	pathAllowlist: z.array(z.string().min(1)).optional(),
	pathDenylist: z.array(z.string().min(1)).optional(),
	metadata: z.record(z.unknown()).optional(),
})

export const EnterpriseTelemetryConfigSchema = z
	.object({
		enabled: z.boolean(),
		serviceName: z.string().min(1),
		otlpEndpoint: z.string().url().optional(),
		headers: z.record(z.string()).optional(),
		promptCapture: z.enum(["off", "metadata", "full"]),
		metricsEnabled: z.boolean(),
		auditEnabled: z.boolean(),
		sampleRate: z.number().min(0).max(1).optional(),
	})
	.superRefine((value, ctx) => {
		if (value.promptCapture === "full" && !value.auditEnabled) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["auditEnabled"],
				message: 'promptCapture "full" requires auditEnabled: true',
			})
		}
	})

export const EnterprisePolicyBundleSchema = z.object({
	id: z.string().min(1),
	version: z.string().min(1),
	source: z.enum(["control-plane", "cache", "file"]),
	issuedAt: z.string().datetime(),
	expiresAt: z.string().datetime().optional(),
	claims: EnterpriseIdentityClaimsSchema.optional(),
	keycloak: KeycloakOidcConfigSchema.optional(),
	artifacts: z.array(ManagedInstructionArtifactSchema),
	toolPolicies: z.array(EnterpriseToolPolicySchema),
	telemetry: EnterpriseTelemetryConfigSchema,
	featureFlags: z.record(z.boolean()),
	metadata: z.record(z.unknown()).optional(),
})

export const EnterpriseEnforcementDecisionSchema = z.object({
	allowed: z.boolean(),
	action: ToolPolicyActionSchema,
	reason: z.string().min(1),
	matchedPolicyIds: z.array(z.string().min(1)),
	auditRequired: z.boolean(),
	redactions: z.array(z.object({ path: z.string().min(1), reason: z.string().min(1) })).optional(),
})

export const EnterpriseAuditEventSchema = z.object({
	id: z.string().min(1),
	timestamp: z.string().datetime(),
	sessionId: z.string().optional(),
	taskId: z.string().optional(),
	host: RuntimeHostSchema,
	userSubject: z.string().optional(),
	organizationId: z.string().optional(),
	projectId: z.string().optional(),
	eventType: z.enum([
		"auth.login",
		"auth.logout",
		"policy.bundle_loaded",
		"policy.decision",
		"tool.requested",
		"tool.approved",
		"tool.denied",
		"skill.used",
		"workflow.used",
		"rule.activated",
		"session.started",
		"session.completed",
		"telemetry.export_failed",
	]),
	severity: z.enum(["debug", "info", "warn", "error"]),
	properties: z.record(z.unknown()),
})

export type EnterprisePolicyBundleInput = z.input<typeof EnterprisePolicyBundleSchema>
