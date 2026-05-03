import type { EnterprisePolicyBundle } from "../types/index.js"

/**
 * Stable v1 surface for signed policy bundles.
 *
 * STUB — full Ed25519 signing/verification, payload canonicalization,
 * and key-rotation rules will be implemented in the SENTRY hardening
 * pass. See STUBS.md and docs/SENTRY.md.
 */
export interface SignedEnvelope<T = EnterprisePolicyBundle> {
	payload: T
	signature: string
	keyId: string
	algorithm: "ed25519"
	signedAt: string
}

export interface KeyStore {
	loadSigningKey(keyId: string): Promise<Uint8Array | undefined>
	loadVerificationKey(keyId: string): Promise<Uint8Array | undefined>
}

export class BundleSigner {
	constructor(private readonly keyStore?: KeyStore) {}

	async sign(_bundle: EnterprisePolicyBundle, _keyId: string): Promise<SignedEnvelope> {
		throw new Error("BundleSigner.sign is not yet implemented (see STUBS.md)")
	}

	async verify(_envelope: SignedEnvelope): Promise<boolean> {
		throw new Error("BundleSigner.verify is not yet implemented (see STUBS.md)")
	}
}
