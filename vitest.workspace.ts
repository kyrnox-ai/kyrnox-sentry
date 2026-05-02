import { defineWorkspace } from "vitest/config"

export default defineWorkspace([
  "packages/*/vitest.config.ts",
  "apps/cli/vitest.config.ts",
  "apps/command-center/vitest.config.ts",
  "apps/vscode-extension/vitest.config.ts",
  "tests/integration/vitest.config.ts",
])
