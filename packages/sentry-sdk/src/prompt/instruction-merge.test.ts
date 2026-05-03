import { describe, expect, it } from "vitest"
import { mergeInstructionSources } from "./instruction-merge.js"

describe("mergeInstructionSources", () => {
	it("renders required enterprise instructions before workspace instructions", () => {
		const merged = mergeInstructionSources({
			enterpriseArtifacts: [
				{ id: "required", name: "Required", kind: "rule", source: "enterprise", contents: "Enterprise first", alwaysEnabled: true, enforcement: "required", priority: 100 },
			],
			workspaceInstructions: ["Workspace last"],
		})
		expect(merged.rendered.indexOf("Enterprise first")).toBeLessThan(merged.rendered.indexOf("Workspace last"))
	})
})
