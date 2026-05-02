import { describe, expect, it } from "vitest"
import { runPolicyCommand } from "./policy.js"

describe("runPolicyCommand", () => {
	it("returns success for status even without a cached bundle", async () => {
		await expect(runPolicyCommand("status", [])).resolves.toBe(0)
	})
})
