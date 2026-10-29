import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class InvalidPaymentModeError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.INVALID_PAYMENT_MODE) {
		super(message, ORDER_ERROR_CODES.INVALID_PAYMENT_MODE);
	}
}
