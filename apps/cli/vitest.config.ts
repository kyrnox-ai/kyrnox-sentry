import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

export default defineConfig({
	resolve: {
		alias: {
			"@kyrnox/shared": fileURLToPath(new URL("../../packages/shared/src/index.ts", import.meta.url)),
			"@kyrnox/core": fileURLToPath(new URL("../../packages/core/src/index.ts", import.meta.url)),
			"@kyrnox/enterprise": fileURLToPath(new URL("../../packages/enterprise/src/index.ts", import.meta.url)),
		},
	}, test: {
		passWithNoTests: true, environment: "node", include: ["src/**/*.test.ts"] } })
