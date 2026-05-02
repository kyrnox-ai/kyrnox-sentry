import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { homedir } from "node:os"
import { EnterprisePolicyBundleSchema, type EnterprisePolicyBundle } from "@kyrnox/shared"

export class FileEnterpriseBundleStore {
	readonly #path: string

	constructor(path = join(homedir(), ".kyrnox", "enterprise", "bundle.json")) {
		this.#path = path
	}

	async load(): Promise<EnterprisePolicyBundle | undefined> {
		try {
			return EnterprisePolicyBundleSchema.parse(JSON.parse(await readFile(this.#path, "utf8")))
		} catch (error) {
			if (error instanceof Error && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT") return undefined
			throw error
		}
	}

	async save(bundle: EnterprisePolicyBundle): Promise<void> {
		const parsed = EnterprisePolicyBundleSchema.parse(bundle)
		await mkdir(dirname(this.#path), { recursive: true, mode: 0o700 })
		await writeFile(this.#path, `${JSON.stringify(parsed, null, 2)}\n`, { mode: 0o600 })
	}

	async clear(): Promise<void> {
		await rm(this.#path, { force: true })
	}
}
