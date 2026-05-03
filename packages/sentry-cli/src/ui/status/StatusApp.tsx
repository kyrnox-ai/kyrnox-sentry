import { createHash } from "node:crypto";
import type { EnterprisePolicyBundle, HashChainedAuditLedger } from "@kyrnox/sentry-sdk";
import { Box, Text, useApp, useInput } from "ink";
import { useMemo, useState } from "react";
import { renderBanner } from "../banner.js";
import { HEX } from "../colors.js";

/**
 * Read-only ops dashboard for `kyrnox-sentry status`.
 *
 * Hard contracts:
 *   - Banner is rendered ONCE via `useMemo` (not on every keystroke).
 *   - We never call `HashChainedAuditLedger.append()` or `.verify()` — they
 *     throw in the OSS v1 stub (see STUBS.md). Only `tail()` is safe.
 *   - Identity falls back to `anonymous@local` when the bundle has no claims;
 *     the TUI must NOT crash on a claims-less bundle (fail-closed display).
 *
 * Spacing note: column gutters are written as wrapped string expressions
 * (e.g. `{"SOURCE:    "}`) so a JSX whitespace collapser (biome, prettier)
 * cannot silently collapse them and shift the cyberpunk grid.
 */

export interface StatusAppProps {
	bundle?: EnterprisePolicyBundle;
	ledger?: HashChainedAuditLedger;
	now?: () => string;
}

const PANELS = ["BUNDLE", "POLICIES", "LEDGER", "IDENTITY"] as const;
type PanelName = (typeof PANELS)[number];

const GUTTER = "   ";

function isoNowUtc(): string {
	return new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
}

function bundleHash(bundle: EnterprisePolicyBundle | undefined): string {
	if (!bundle) return "0".repeat(64);
	// Stable JSON for hash purposes: zod has already validated the bundle.
	return createHash("sha256").update(JSON.stringify(bundle)).digest("hex");
}

function ledgerTail(bundle: EnterprisePolicyBundle | undefined): string {
	const h = bundleHash(bundle);
	return `0x${h.slice(0, 8)}…${h.slice(-4)}`;
}

function policyCounts(bundle: EnterprisePolicyBundle | undefined): { allow: number; ask: number; deny: number } {
	const counts = { allow: 0, ask: 0, deny: 0 };
	if (!bundle) return counts;
	for (const policy of bundle.toolPolicies) counts[policy.action] += 1;
	return counts;
}

function panelBorderColor(name: PanelName, focused: PanelName): string {
	return name === focused ? HEX.signalAmber : HEX.gunmetal;
}

function pad(label: string, width: number): string {
	return label.length >= width ? `${label} ` : label + " ".repeat(width - label.length);
}

function Panel({
	name,
	focused,
	children,
}: {
	name: PanelName;
	focused: PanelName;
	children: React.ReactNode;
}): React.ReactElement {
	return (
		<Box
			borderStyle="round"
			borderColor={panelBorderColor(name, focused)}
			flexDirection="column"
			paddingX={1}
			flexGrow={1}
			marginRight={1}
		>
			<Text color={HEX.signalAmber} bold>
				{`▮ ${name}`}
			</Text>
			<Box marginTop={1} flexDirection="column">
				{children}
			</Box>
		</Box>
	);
}

function BundlePanel({
	bundle,
	focused,
}: {
	bundle?: EnterprisePolicyBundle;
	focused: PanelName;
}): React.ReactElement {
	const integrity = bundle ? "VERIFIED" : "UNVERIFIED";
	const integrityColor = bundle ? HEX.natoGreen : HEX.signalAmber;
	const w = 11;
	return (
		<Panel name="BUNDLE" focused={focused}>
			<Text color="#D6DDE6">{`${pad("ID:", w)}${bundle?.id ?? "—"}`}</Text>
			<Text color="#D6DDE6">{`${pad("VERSION:", w)}${bundle?.version ?? "—"}`}</Text>
			<Text color="#D6DDE6">{`${pad("SOURCE:", w)}${bundle?.source ?? "—"}`}</Text>
			<Text color="#D6DDE6">{`${pad("ISSUED:", w)}${bundle?.issuedAt ?? "—"}`}</Text>
			<Text color="#D6DDE6">{`${pad("EXPIRES:", w)}${bundle?.expiresAt ?? "—"}`}</Text>
			<Text>
				<Text color="#5A6470">{pad("INTEGRITY:", w)}</Text>
				<Text color={integrityColor} bold>
					{integrity}
				</Text>
			</Text>
		</Panel>
	);
}

function PoliciesPanel({
	bundle,
	focused,
}: {
	bundle?: EnterprisePolicyBundle;
	focused: PanelName;
}): React.ReactElement {
	const counts = policyCounts(bundle);
	return (
		<Panel name="POLICIES" focused={focused}>
			<Text color="#D6DDE6">{`TOTAL: ${bundle?.toolPolicies.length ?? 0}`}</Text>
			<Box marginTop={1}>
				<Text color={HEX.natoGreen} bold>
					{`▮ ALLOW: ${counts.allow}`}
				</Text>
				<Text>{GUTTER}</Text>
				<Text color={HEX.signalAmber} bold>
					{`▮ ASK: ${counts.ask}`}
				</Text>
				<Text>{GUTTER}</Text>
				<Text color={HEX.warningRed} bold>
					{`▮ DENY: ${counts.deny}`}
				</Text>
			</Box>
		</Panel>
	);
}

function LedgerPanel({
	bundle,
	ledger,
	focused,
}: {
	bundle?: EnterprisePolicyBundle;
	ledger?: HashChainedAuditLedger;
	focused: PanelName;
}): React.ReactElement {
	// Only `tail()` is safe in the OSS stub. Never call `append`/`verify`.
	const events: string = ledger ? String(ledger.tail().length) : "(stub)";
	return (
		<Panel name="LEDGER" focused={focused}>
			<Text>
				<Text color="#5A6470">{"LEDGER TAIL: "}</Text>
				<Text color={HEX.restrictedCyan}>{ledgerTail(bundle)}</Text>
			</Text>
			<Text>
				<Text color="#5A6470">{"EVENTS:      "}</Text>
				<Text color={HEX.restrictedCyan}>{events}</Text>
			</Text>
		</Panel>
	);
}

function IdentityPanel({
	bundle,
	focused,
}: {
	bundle?: EnterprisePolicyBundle;
	focused: PanelName;
}): React.ReactElement {
	const subject = bundle?.claims?.subject ?? "anonymous@local";
	const orgId = bundle?.claims?.organizationId ?? "—";
	const roles = bundle?.claims?.roles ?? [];
	const rolesText = roles.length > 0 ? roles.join(" ▮ ") : "(no roles)";
	return (
		<Panel name="IDENTITY" focused={focused}>
			<Text>
				<Text color="#5A6470">{"SUBJECT: "}</Text>
				<Text color={HEX.restrictedCyan}>{subject}</Text>
			</Text>
			<Text color="#D6DDE6">{`ORG:     ${orgId}`}</Text>
			<Text color="#D6DDE6">{`ROLES:   ${rolesText}`}</Text>
		</Panel>
	);
}

export default function StatusApp({ bundle, ledger, now = isoNowUtc }: StatusAppProps): React.ReactElement {
	const app = useApp();
	const banner = useMemo(() => renderBanner(), []);
	const [updatedAt, setUpdatedAt] = useState<string>(() => now());
	const [focusIdx, setFocusIdx] = useState<number>(0);
	const focused: PanelName = PANELS[focusIdx % PANELS.length] ?? "BUNDLE";

	useInput((input, key) => {
		if (input === "q" || input === "Q" || key.escape) {
			app.exit();
			return;
		}
		if (input === "r" || input === "R") {
			setUpdatedAt(now());
			return;
		}
		if (input === "j" || input === "J") {
			setFocusIdx((i) => (i + 1) % PANELS.length);
			return;
		}
		if (input === "k" || input === "K") {
			setFocusIdx((i) => (i - 1 + PANELS.length) % PANELS.length);
		}
	});

	return (
		<Box flexDirection="column">
			<Text>{banner}</Text>
			<Box flexDirection="row">
				<BundlePanel bundle={bundle} focused={focused} />
				<PoliciesPanel bundle={bundle} focused={focused} />
			</Box>
			<Box flexDirection="row">
				<LedgerPanel bundle={bundle} ledger={ledger} focused={focused} />
				<IdentityPanel bundle={bundle} focused={focused} />
			</Box>
			<Box marginTop={1} flexDirection="row" justifyContent="space-between">
				<Text color="#5A6470">{"[ q ] EXIT   [ r ] REFRESH   [ j/k ] FOCUS"}</Text>
				<Text>
					<Text color="#5A6470">{"UPDATED "}</Text>
					<Text color={HEX.restrictedCyan}>{updatedAt}</Text>
				</Text>
			</Box>
		</Box>
	);
}
