import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

/**
 * Vite configuration for the SENTRY ops console demo.
 *
 * `base` is pinned to `/kyrnox-sentry/` because the workflow at
 * `.github/workflows/pages.yml` deploys this build to GitHub Pages under
 * `https://kyrnox-ai.github.io/kyrnox-sentry/`. Local `npm run preview`
 * also resolves correctly under that prefix.
 *
 * The `@kyrnox/sentry-sdk` alias points at a curated browser shim
 * (`src/sdk/sentry-sdk-browser.ts`) that re-exports only the pure,
 * tree-shakeable surface of the SDK (evaluator, schema, types, prompt
 * merge). The SDK's published barrel additionally re-exports
 * `FileBundleStore`/`AuditService`/`EnterpriseTelemetryService` which
 * import Node-only modules (`node:fs`/`node:path`/`node:os`); aliasing
 * to the shim keeps those out of the browser bundle. The four v1 stub
 * primitives (BundleSigner, HashChainedAuditLedger,
 * FirmwareBaselineVerifier, GeoAOIPolicy) are deliberately omitted —
 * the demo surfaces them as ⚠ STUB chips that link to STUBS.md.
 */
const sdkBrowser = fileURLToPath(new URL("./src/sdk/sentry-sdk-browser.ts", import.meta.url));

export default defineConfig({
	base: "/kyrnox-sentry/",
	plugins: [react()],
	resolve: {
		alias: {
			"@kyrnox/sentry-sdk": sdkBrowser,
		},
	},
	build: {
		target: "es2022",
		sourcemap: true,
		// Self-hosted @fontsource files only — no Google Fonts, no external CDN.
		assetsInlineLimit: 0,
	},
	server: {
		port: 5174,
	},
});
