#!/usr/bin/env node
import { Command } from "commander"
import { KyrnoxRuntime, FileBundleStore } from "@kyrnox/sentry-sdk"
import { runCheckpointCommand } from "./commands/checkpoint.js"
import { runConfigCommand } from "./commands/config.js"
import { runDoctorCommand } from "./commands/doctor.js"
import { runHistoryCommand } from "./commands/history.js"
import { runProviderCommand } from "./commands/provider.js"

const program = new Command()

program.name("kyrnox-sentry").description("Kyrnox SENTRY open-source CLI").version("1.0.0-alpha.1")

program
	.argument("[prompt...]", "prompt text for default task execution")
	.option("-p, --plan", "run in plan mode")
	.option("-a, --act", "run in act mode")
	.option("-m, --model <model>", "override model")
	.option("--json", "emit JSON output")
	.action(async (promptParts: string[], options: { plan?: boolean; act?: boolean; model?: string; json?: boolean }) => {
		if (promptParts.length === 0) return
		process.exitCode = await runTask(promptParts.join(" "), options)
	})

program
	.command("config")
	.argument("[args...]", "config command arguments")
	.description("Show current Kyrnox SENTRY configuration")
	.action(async (args: string[]) => {
		process.exitCode = await runConfigCommand(args)
	})

program
	.command("provider")
	.argument("[action]", "list | models", "list")
	.argument("[args...]", "provider command arguments")
	.description("Inspect Kyrnox SENTRY tools providers and models")
	.action(async (action: string, args: string[]) => {
		process.exitCode = await runProviderCommand(action, args)
	})

program
	.command("task")
	.alias("t")
	.argument("<prompt...>", "prompt text")
	.option("-p, --plan", "run in plan mode")
	.option("-a, --act", "run in act mode")
	.option("-m, --model <model>", "override model")
	.option("--json", "emit JSON output")
	.description("Start a Kyrnox SENTRY task")
	.action(async (promptParts: string[], options: { plan?: boolean; act?: boolean; model?: string; json?: boolean }) => {
		process.exitCode = await runTask(promptParts.join(" "), options)
	})

program
	.command("history")
	.alias("h")
	.argument("[action]", "list | show | update | delete", "list")
	.description("Inspect Kyrnox SENTRY task history")
	.action(async (action: string) => {
		process.exitCode = await runHistoryCommand(action)
	})

program
	.command("checkpoint")
	.argument("[action]", "status | list | restore", "status")
	.description("Inspect or restore Kyrnox SENTRY checkpoints")
	.action(async (action: string) => {
		process.exitCode = await runCheckpointCommand(action)
	})

program
	.command("doctor")
	.option("--json", "emit JSON output")
	.description("Check local Kyrnox SENTRY configuration and required env vars")
	.action(async (options: { json?: boolean }) => {
		const args: string[] = []
		if (options.json) args.push("--json")
		process.exitCode = await runDoctorCommand(args)
	})

program
	.command("run")
	.argument("<prompt>")
	.description("Start a headless Kyrnox SENTRY task")
	.action(async (prompt: string) => {
		const bundle = await new FileBundleStore().load().catch(() => undefined)
		const runtime = new KyrnoxRuntime(bundle)
		const result = await runtime.startSession({ prompt, host: "cli", workspacePath: process.cwd(), bundle })
		console.log(JSON.stringify({ ...result, bundleLoaded: Boolean(bundle) }, null, 2))
	})

async function runTask(prompt: string, options: { plan?: boolean; act?: boolean; model?: string; json?: boolean } = {}): Promise<number> {
	const bundle = await new FileBundleStore().load().catch(() => undefined)
	const runtime = new KyrnoxRuntime(bundle)
	const result = await runtime.startSession({ prompt, host: "cli", workspacePath: process.cwd(), bundle })
	const output = { ...result, mode: options.plan ? "plan" : options.act ? "act" : "act", model: options.model, bundleLoaded: Boolean(bundle) }
	console.log(JSON.stringify(output, null, 2))
	return 0
}

program.parseAsync(process.argv).catch((error) => {
	console.error(error)
	process.exitCode = 1
})
