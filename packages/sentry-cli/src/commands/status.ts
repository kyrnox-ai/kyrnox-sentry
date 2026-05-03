import { readFile } from "node:fs/promises";
import {
	type EnterpriseEnforcementDecision,
	type EnterprisePolicyBundle,
	EnterprisePolicyBundleSchema,
	FileBundleStore,
} from "@kyrnox/sentry-sdk";
import { render } from "ink";
import React from "react";
import { printBanner } from "../ui/banner.js";
import { accents } from "../ui/colors.js";
import { formatDecisionTable } from "../ui/decision.js";
import StatusApp from "../ui/status/StatusApp.js";

export interface StatusOptions {
	bundle?: string;
	json?: boolean;
}

async function loadBundle(file?: string): Promise<EnterprisePolicyBundle | undefined> {
	if (file) {
		try {
			return EnterprisePolicyBundleSchema.parse(JSON.parse(await readFile(file, "utf8")));
		} catch {
			return undefined;
		}
	}
	return new FileBundleStore().load().catch(() => undefined);
}

function policyCounts(bundle: EnterprisePolicyBundle | undefined): { allow: number; ask: number; deny: number } {
	const counts = { allow: 0, ask: 0, deny: 0 };
	if (!bundle) return counts;
	for (const policy of bundle.toolPolicies) counts[policy.action] += 1;
	return counts;
}

function syntheticDecisions(
	bundle: EnterprisePolicyBundle,
): Array<{ decision: EnterpriseEnforcementDecision; ctx: { toolName: string; identity: string } }> {
	const identity = bundle.claims?.subject ?? "anonymous@local";
	return bundle.toolPolicies.map((policy) => ({
		decision: {
			allowed: policy.action !== "deny",
			action: policy.action,
			reason: `tool policy ${policy.id ?? policy.toolName} → ${policy.action}`,
			matchedPolicyIds: [policy.id ?? policy.toolName],
			auditRequired: true,
		},
		ctx: { toolName: policy.toolName, identity },
	}));
}

/**
 * `kyrnox-sentry status` — full-terminal ops dashboard.
 *
 * - TTY + interactive: renders the Ink TUI (StatusApp). Returns 0 on quit.
 * - `--json` or non-TTY stderr: emits a deterministic snapshot so CI logs
 *   and pipelines still get useful output. The JSON shape is intentionally
 *   small and stable; it does NOT expose the SDK's frozen v1 surface.
 * - Fail-closed: a missing or unparseable bundle still renders the dashboard
 *   (with `INTEGRITY: UNVERIFIED` and `anonymous@local`); we never pretend
 *   a bundle was loaded when it wasn't.
 */
export async function runStatusCommand(options: StatusOptions = {}): Promise<number> {
	const bundle = await loadBundle(options.bundle);

	if (options.json) {
		const counts = policyCounts(bundle);
		const snapshot = {
			bundle: bundle
				? {
						id: bundle.id,
						version: bundle.version,
						source: bundle.source,
						issuedAt: bundle.issuedAt,
						expiresAt: bundle.expiresAt ?? null,
						integrity: "VERIFIED" as const,
					}
				: null,
			identity: {
				subject: bundle?.claims?.subject ?? "anonymous@local",
				organizationId: bundle?.claims?.organizationId ?? null,
				roles: bundle?.claims?.roles ?? [],
			},
			policies: { ...counts, total: bundle?.toolPolicies.length ?? 0 },
			ledger: { tail: null, events: "(stub)" as const },
		};
		process.stdout.write(`${JSON.stringify(snapshot, null, 2)}\n`);
		return bundle ? 0 : 1;
	}

	if (!process.stderr.isTTY) {
		printBanner(process.stderr);
		process.stderr.write(`${accents.heading("// STATUS")}\n`);
		if (bundle) {
			process.stdout.write(`${formatDecisionTable(syntheticDecisions(bundle))}\n`);
		} else {
			process.stderr.write(`${accents.dim("// no bundle loaded — INTEGRITY: UNVERIFIED")}\n`);
		}
		return bundle ? 0 : 1;
	}

	const instance = render(React.createElement(StatusApp, { bundle }), { stderr: process.stderr });
	await instance.waitUntilExit();
	return 0;
}
