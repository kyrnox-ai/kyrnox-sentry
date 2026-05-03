import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@kyrnox/sentry-sdk": fileURLToPath(new URL("../sentry-sdk/src/index.ts", import.meta.url)),
			"@kyrnox/sentry-tools": fileURLToPath(new URL("../sentry-tools/src/index.ts", import.meta.url)),
		},
	},
	esbuild: {
		jsx: "automatic",
	},
	test: {
		passWithNoTests: true,
		environment: "node",
		include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
	},
})
