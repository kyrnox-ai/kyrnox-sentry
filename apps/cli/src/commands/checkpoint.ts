export async function runCheckpointCommand(action = "status"): Promise<number> {
	console.log(JSON.stringify({ action, checkpoints: [], message: "Kyrnox checkpoint command surface is available; checkpoint storage will be wired to runtime sessions." }, null, 2))
	return 0
}