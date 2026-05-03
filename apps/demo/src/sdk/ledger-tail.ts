/**
 * Synthetic ledger tail for the demo.
 *
 * The OSS `HashChainedAuditLedger` is a v1 stub: `append()` and `verify()`
 * throw `not yet implemented` (see STUBS.md). The browser surface MUST
 * NOT call them. Instead, we hash a stable JSON serialization of the
 * bundle with `crypto.subtle.digest("SHA-256")` and label the result as
 * a ⚠ STUB on the rendered panel so the operator sees that the value is
 * cosmetic, not an attestation.
 */
export async function bundleSha256Hex(bundleJson: string): Promise<string> {
	const data = new TextEncoder().encode(bundleJson);
	const buf = await crypto.subtle.digest("SHA-256", data);
	const bytes = new Uint8Array(buf);
	let hex = "";
	for (const b of bytes) hex += b.toString(16).padStart(2, "0");
	return hex;
}

export function shortLedgerTail(hashHex: string): string {
	if (hashHex.length < 12) return `0x${hashHex}`;
	return `0x${hashHex.slice(0, 8)}\u2026${hashHex.slice(-4)}`;
}
