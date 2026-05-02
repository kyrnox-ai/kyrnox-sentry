import type { EnterpriseTelemetryConfig } from "@kyrnox/shared"

export interface TelemetryEvent {
	name: string
	properties?: Record<string, unknown>
}

export class EnterpriseTelemetryService {
	constructor(readonly config: EnterpriseTelemetryConfig) {}

	capture(event: TelemetryEvent): void {
		if (!this.config.enabled) return
		// OpenTelemetry exporters are wired in the observability step. This keeps the runtime API stable.
		void event
	}
}

export function createEnterpriseTelemetryService(config: EnterpriseTelemetryConfig): EnterpriseTelemetryService {
	return new EnterpriseTelemetryService(config)
}
