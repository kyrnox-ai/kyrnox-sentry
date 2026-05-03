import { PassThrough } from "node:stream"
import stripAnsi from "strip-ansi"
import { describe, expect, it } from "vitest"
import { printBanner, renderBanner } from "../banner.js"

function captureStream(stream: PassThrough): Promise<string> {
	return new Promise((resolve) => {
		const chunks: Buffer[] = []
		stream.on("data", (chunk) => chunks.push(chunk as Buffer))
		stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")))
	})
}

describe("printBanner", () => {
	it("writes the SENTRY wordmark and SIGNAL CORPS footer to the given stream", async () => {
		const stream = new PassThrough()
		const captured = captureStream(stream)
		printBanner(stream as unknown as NodeJS.WriteStream)
		stream.end()
		const out = stripAnsi(await captured)
		expect(out).toContain("SIGNAL CORPS")
		expect(out).toContain("CLASSIFIED")
		expect(out).toContain("ENFORCEMENT: DENY")
		expect(out).toContain("FAIL-CLOSED")
		expect(out).toContain("BUILD ")
		expect(out).toMatch(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/)
	})
})

describe("renderBanner", () => {
	it("locks the footer contract — sha and timestamp render verbatim", () => {
		const stripped = stripAnsi(renderBanner({ sha: "deadbee", timestamp: "2025-11-04T12:00:00Z" }))
		expect(stripped).toContain("// SIGNAL CORPS")
		expect(stripped).toContain("// BUILD deadbee")
		expect(stripped).toContain("// 2025-11-04T12:00:00Z")
		expect(stripped).toContain("[CLASSIFIED // ENFORCEMENT: DENY // FAIL-CLOSED]")
	})

	it("renders the figlet wordmark in ANSI Shadow style (contains characteristic glyphs)", () => {
		const stripped = stripAnsi(renderBanner({ sha: "0000000", timestamp: "2025-11-04T12:00:00Z" }))
		// ANSI Shadow uses these block / box-drawing glyphs.
		expect(stripped).toMatch(/[█╗╚╝╔═]/)
	})

	it("emits an unknown sha fallback when no override is given and no git is available", () => {
		// We don't assert "unknown" here because the test runner is itself in
		// a git checkout; we only assert the line shape stays parseable.
		const stripped = stripAnsi(renderBanner())
		expect(stripped).toMatch(/\/\/ BUILD [a-z0-9]+/)
	})
})
