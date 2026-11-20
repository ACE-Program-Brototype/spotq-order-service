import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class PaymentRefundFailedError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.PAYMENT_REFUND_FAILED) {
		super(message, ORDER_ERROR_CODES.PAYMENT_REFUND_FAILED);
	}
}
