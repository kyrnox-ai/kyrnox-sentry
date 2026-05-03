import type { EnterpriseAuditEvent } from "../types/index.js"

/**
 * STUB — append-only, hash-chained audit ledger. Each row's `prevHash`
 * is the SHA-256 of the previous row's serialized form, making the
 * ledger tamper-evident. Full implementation lands with SENTRY hardening.
 */
export interface LedgerRow {
	index: number
	event: EnterpriseAuditEvent
	prevHash: string
	hash: string
	signedAt: string
}

export class HashChainedAuditLedger {
	readonly #rows: LedgerRow[] = []

	async append(_event: EnterpriseAuditEvent): Promise<LedgerRow> {
		throw new Error("HashChainedAuditLedger.append is not yet implemented (see STUBS.md)")
	}

	async verify(): Promise<{ valid: boolean; brokenAt?: number }> {
		throw new Error("HashChainedAuditLedger.verify is not yet implemented (see STUBS.md)")
	}

	tail(_n = 100): LedgerRow[] {
		return this.#rows.slice(-_n)
	}
}
