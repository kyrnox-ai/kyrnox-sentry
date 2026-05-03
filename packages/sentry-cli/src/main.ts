#!/usr/bin/env node
import { Command } from "commander"
import { FileBundleStore, KyrnoxRuntime } from "@kyrnox/sentry-sdk"
import { runCheckpointCommand } from "./commands/checkpoint.js"
import { runConfigCommand } from "./commands/config.js"
import { runDoctorCommand } from "./commands/doctor.js"
import { runEvaluateCommand } from "./commands/evaluate.js"
import { runHistoryCommand } from "./commands/history.js"
import { runProviderCommand } from "./commands/provider.js"
import { runVerifyCommand } from "./commands/verify.js"
import { printBanner } from "./ui/banner.js"

const program = new Command()

program.name("kyrnox-sentry").description("Kyrnox SENTRY open-source CLI").version("1.0.0-alpha.1")

program.option("--no-banner", "suppress the SENTRY boot banner")

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
	.command("evaluate")
	.description("Evaluate a hypothetical tool call against the loaded SENTRY policy bundle")
	.requiredOption("--tool <name>", "tool name to evaluate (e.g. execute_command)")
	.option("--command <command>", "command string to test against command allow/deny lists")
	.option("--path <path>", "filesystem path to test against path allow/deny lists")
	.option("--identity <identity>", "identity label to render in the decision row")
	.option("--bundle <file>", "path to a policy bundle JSON file (defaults to ~/.kyrnox/enterprise/bundle.json)")
	.option("--json", "emit JSON output")
	.action(async (options: { tool: string; command?: string; path?: string; identity?: string; bundle?: string; json?: boolean }) => {
		process.exitCode = await runEvaluateCommand(options)
	})

program
	.command("verify")
	.description("Verify the integrity and schema of a SENTRY policy bundle")
	.option("--bundle <file>", "path to a policy bundle JSON file (defaults to ~/.kyrnox/enterprise/bundle.json)")
	.option("--json", "emit JSON output")
	.action(async (options: { bundle?: string; json?: boolean }) => {
		process.exitCode = await runVerifyCommand(options)
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

/**
 * Boot banner is rendered to stderr (not stdout) so JSON-on-stdout pipelines
 * — the kyrnox-platform CLI bridge, audit shippers, scripts — stay byte-clean.
 * The banner is also suppressed when stderr is not a TTY (e.g. CI logs piped
 * into a file) and when the user passes `--no-banner`.
 */
function shouldShowBanner(argv: string[]): boolean {
	if (argv.includes("--no-banner")) return false
	if (!process.stderr.isTTY) return false
	if (argv.includes("--json")) return false
	return true
}

if (shouldShowBanner(process.argv)) printBanner(process.stderr)

program.parseAsync(process.argv).catch((error) => {
	console.error(error)
	process.exitCode = 1
})
