import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { homedir } from "node:os"
import { EnterprisePolicyBundleSchema, type EnterprisePolicyBundle } from "../types/index.js"

/**
 * Local-only bundle store backed by a JSON file. Hackathon users get a
 * working bundle store without standing up a control plane. The
 * commercial Kyrnox Platform implements a multi-tenant `BundleStore`
 * against Postgres + GCS; the SDK contract is the same.
 */
export class FileBundleStore {
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

/** Backwards-compat re-export: pre-split name. */
export { FileBundleStore as FileEnterpriseBundleStore }
