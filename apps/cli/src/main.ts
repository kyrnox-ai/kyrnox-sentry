#!/usr/bin/env node
import { Command } from "commander"
import { KyrnoxRuntime } from "@kyrnox/core"
import { runKeycloakAuthCommand } from "./commands/auth.js"
import { runCheckpointCommand } from "./commands/checkpoint.js"
import { runConfigCommand } from "./commands/config.js"
import { runDoctorCommand } from "./commands/doctor.js"
import { runHistoryCommand } from "./commands/history.js"
import { runPolicyCommand } from "./commands/policy.js"
import { runProviderCommand } from "./commands/provider.js"
import { prepareCliEnterpriseIntegration } from "./utils/enterprise.js"
import { sendRuntimeHeartbeat } from "./utils/runtime.js"

const program = new Command()

program.name("kyrnox").description("Enterprise-controlled coding agent CLI").version("0.1.0")

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
	.command("auth")
	.argument("<action>", "device | status | logout | dev-login | provider")
	.argument("[args...]", "auth command arguments")
	.description("Manage Kyrnox enterprise and provider authentication")
	.action(async (action: string, args: string[]) => {
		process.exitCode = await runKeycloakAuthCommand(action, args)
	})

program
	.command("config")
	.argument("[args...]", "config command arguments")
	.description("Show current Kyrnox configuration")
	.action(async (args: string[]) => {
		process.exitCode = await runConfigCommand(args)
	})

program
	.command("policy")
	.argument("<action>", "status | explain")
	.argument("[args...]", "policy command arguments")
	.description("Inspect and explain enterprise policy")
	.action(async (action: string, args: string[]) => {
		process.exitCode = await runPolicyCommand(action, args)
	})

program
	.command("provider")
	.argument("[action]", "list | models", "list")
	.argument("[args...]", "provider command arguments")
	.description("Inspect Kyrnox LLM provider gateway providers and models")
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
	.description("Start a Kyrnox task")
	.action(async (promptParts: string[], options: { plan?: boolean; act?: boolean; model?: string; json?: boolean }) => {
		process.exitCode = await runTask(promptParts.join(" "), options)
	})

program
	.command("history")
	.alias("h")
	.argument("[action]", "list | show | update | delete", "list")
	.description("Inspect Kyrnox task history")
	.action(async (action: string) => {
		process.exitCode = await runHistoryCommand(action)
	})

program
	.command("checkpoint")
	.argument("[action]", "status | list | restore", "status")
	.description("Inspect or restore Kyrnox checkpoints")
	.action(async (action: string) => {
		process.exitCode = await runCheckpointCommand(action)
	})

program.command("mcp").description("Manage MCP server settings").action(() => console.log(JSON.stringify({ servers: [], message: "Kyrnox MCP command surface is available." }, null, 2)))
program.command("hook").description("Handle a hook payload from stdin").action(() => console.log(JSON.stringify({ handled: false, message: "Kyrnox hook command surface is available." }, null, 2)))
program.command("hook-worker").description("Run the Kyrnox hook worker").action(() => console.log(JSON.stringify({ running: false, message: "Kyrnox hook worker surface is available." }, null, 2)))
program.command("rpc").description("Manage the Kyrnox RPC runtime").action(() => console.log(JSON.stringify({ running: false, message: "Kyrnox RPC command surface is available." }, null, 2)))
program.command("schedule").description("Manage scheduled Kyrnox tasks").action(() => console.log(JSON.stringify({ schedules: [], message: "Kyrnox schedule command surface is available." }, null, 2)))
program.command("connect").description("Connect Kyrnox to an editor or adapter").action(() => console.log(JSON.stringify({ adapters: [], message: "Kyrnox connect command surface is available." }, null, 2)))
program.command("update").description("Check for Kyrnox updates").action(() => console.log(JSON.stringify({ updateAvailable: false, message: "Update checks are not configured for this local build." }, null, 2)))
program.command("version").description("Show Kyrnox CLI version").action(() => console.log("0.1.0"))

program
	.command("doctor")
	.option("--json", "emit JSON output")
	.option("--no-network", "skip control-plane / Keycloak reachability checks")
	.description("Check local Kyrnox configuration, required env vars, and control-plane reachability")
	.action(async (options: { json?: boolean; network?: boolean }) => {
		const args: string[] = []
		if (options.json) args.push("--json")
		if (options.network === false) args.push("--no-network")
		process.exitCode = await runDoctorCommand(args)
	})

program
	.command("run")
	.argument("<prompt>")
	.description("Start a headless Kyrnox task")
	.action(async (prompt: string) => {
		const enterprise = await prepareCliEnterpriseIntegration()
		const runtime = new KyrnoxRuntime(enterprise.enabled ? enterprise.bundle : undefined)
		const result = await runtime.startSession({ prompt, host: "cli", workspacePath: process.cwd(), bundle: enterprise.enabled ? enterprise.bundle : undefined })
		console.log(JSON.stringify({ ...result, enterprise }, null, 2))
	})

async function runTask(prompt: string, options: { plan?: boolean; act?: boolean; model?: string; json?: boolean } = {}): Promise<number> {
	await sendRuntimeHeartbeat().catch(() => undefined)
	const enterprise = await prepareCliEnterpriseIntegration()
	const runtime = new KyrnoxRuntime(enterprise.enabled ? enterprise.bundle : undefined)
	const result = await runtime.startSession({ prompt, host: "cli", workspacePath: process.cwd(), bundle: enterprise.enabled ? enterprise.bundle : undefined })
	const output = { ...result, mode: options.plan ? "plan" : options.act ? "act" : "act", model: options.model, enterprise }
	if (options.json) console.log(JSON.stringify(output, null, 2))
	else console.log(JSON.stringify(output, null, 2))
	return 0
}

program.parseAsync(process.argv).catch((error) => {
	console.error(error)
	process.exitCode = 1
})
