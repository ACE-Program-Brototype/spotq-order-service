import { DomainError } from "./domain.error.ts";

export class PaymentGatewayDraftFailedError extends DomainError {
	constructor(
		message: string = "Failed to initiate payment gateway order draft",
	) {
		super(message, "PAYMENT_GATEWAY_DRAFT_FAILED");
	}
}
