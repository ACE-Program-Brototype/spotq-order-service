import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class PaymentGatewayDraftFailedError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.PAYMENT_GATEWAY_DRAFT_FAILED) {
		super(message, ORDER_ERROR_CODES.PAYMENT_GATEWAY_DRAFT_FAILED);
	}
}
