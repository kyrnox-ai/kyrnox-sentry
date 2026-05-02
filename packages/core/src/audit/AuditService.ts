import type { EnterpriseAuditEvent } from "@kyrnox/shared"

export interface AuditExporter {
	export(event: EnterpriseAuditEvent): Promise<void>
}

export class AuditService {
	readonly #queue: EnterpriseAuditEvent[] = []

	constructor(private readonly exporter?: AuditExporter) {}

	capture(event: EnterpriseAuditEvent): void {
		this.#queue.push(event)
	}

	listBuffered(): EnterpriseAuditEvent[] {
		return [...this.#queue]
	}

	async flush(): Promise<void> {
		if (!this.exporter) return
		while (this.#queue.length > 0) {
			const event = this.#queue.shift()
			if (!event) continue
			await this.exporter.export(event)
		}
	}
}

export async function captureEnterpriseAuditEvent(event: EnterpriseAuditEvent, service = new AuditService()): Promise<void> {
	service.capture(event)
	await service.flush()
}
