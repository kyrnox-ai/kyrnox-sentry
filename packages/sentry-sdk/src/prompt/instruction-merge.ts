import type { ManagedInstructionArtifact } from "../types/index.js"

export interface InstructionMergeInput {
	enterpriseArtifacts?: ManagedInstructionArtifact[]
	remoteAdvisoryArtifacts?: ManagedInstructionArtifact[]
	userGlobalInstructions?: string[]
	workspaceInstructions?: string[]
}

export interface MergedInstructionSet {
	rendered: string
	artifacts: ManagedInstructionArtifact[]
	sections: Array<{ title: string; contents: string }>
}

export function mergeInstructionSources(input: InstructionMergeInput): MergedInstructionSet {
	const requiredEnterprise = (input.enterpriseArtifacts ?? [])
		.filter((artifact) => artifact.enforcement === "required" || artifact.alwaysEnabled)
		.sort(byPriorityDesc)
	const advisoryEnterprise = [...(input.remoteAdvisoryArtifacts ?? []), ...(input.enterpriseArtifacts ?? []).filter((artifact) => artifact.enforcement === "advisory" && !artifact.alwaysEnabled)].sort(byPriorityDesc)

	const sections = [
		...requiredEnterprise.map((artifact) => section(`Enterprise required: ${artifact.name}`, artifact.contents)),
		...advisoryEnterprise.map((artifact) => section(`Enterprise advisory: ${artifact.name}`, artifact.contents)),
		...(input.userGlobalInstructions ?? []).map((contents) => section("User global", contents)),
		...(input.workspaceInstructions ?? []).map((contents) => section("Workspace", contents)),
	]

	return {
		rendered: sections.map((item) => `## ${item.title}\n${item.contents}`).join("\n\n"),
		artifacts: [...requiredEnterprise, ...advisoryEnterprise],
		sections,
	}
}

function byPriorityDesc(a: ManagedInstructionArtifact, b: ManagedInstructionArtifact): number {
	return b.priority - a.priority
}

function section(title: string, contents: string): { title: string; contents: string } {
	return { title, contents }
}
