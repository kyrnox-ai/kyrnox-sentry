import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@kyrnox/sentry-sdk": fileURLToPath(new URL("../sentry-sdk/src/index.ts", import.meta.url)),
		},
	},
	test: {
		passWithNoTests: true,
		environment: "node",
		include: ["src/**/*.test.ts"],
	},
})
