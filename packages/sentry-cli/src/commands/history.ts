export async function runHistoryCommand(action = "list"): Promise<number> {
	console.log(JSON.stringify({ action, sessions: [], message: "Kyrnox history command surface is available; persistent session history will be populated by the runtime integration." }, null, 2))
	return 0
}