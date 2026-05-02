import { describe, expect, it } from "vitest"
import { createKyrnoxGateway, KYRNOX_PROVIDER_DEFAULT_MODEL, KYRNOX_PROVIDER_ID } from "./index.js"

describe("Kyrnox provider gateway", () => {
	it("registers the Kyrnox provider instead of the Cline provider", () => {
		const gateway = createKyrnoxGateway()
		const providers = gateway.listProviders()
		expect(providers.some((provider) => provider.id === KYRNOX_PROVIDER_ID)).toBe(true)
		expect(providers.some((provider) => provider.id === "cline")).toBe(false)
	})

	it("resolves the enterprise Kyrnox default model", () => {
		const gateway = createKyrnoxGateway()
		const resolved = gateway.resolveModel({ providerId: "kyrnox" })
		expect(resolved.provider.name).toBe("Kyrnox")
		expect(resolved.model.id).toBe(KYRNOX_PROVIDER_DEFAULT_MODEL)
		expect(resolved.provider.apiKeyEnv).toEqual(["KYRNOX_API_KEY"])
	})
})