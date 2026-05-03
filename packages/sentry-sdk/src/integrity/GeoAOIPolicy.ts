/**
 * STUB — Geo Area of Interest (AOI) policy. Determines whether a
 * point-in-time location falls inside an allowlisted polygon for a
 * given identity. Full implementation lands with SENTRY hardening.
 */
export interface GeoPoint {
	lat: number
	lon: number
}

export interface GeoAOI {
	id: string
	name: string
	polygon: GeoPoint[]
	roles?: string[]
}

export class GeoAOIPolicy {
	constructor(private readonly aois: GeoAOI[] = []) {}

	contains(_point: GeoPoint, _roles: string[] = []): { allowed: boolean; matchedAoiId?: string; reason: string } {
		throw new Error("GeoAOIPolicy.contains is not yet implemented (see STUBS.md)")
	}
}
