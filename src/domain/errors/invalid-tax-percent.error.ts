import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class InvalidTaxPercentError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.INVALID_TAX_PERCENT) {
		super(message, ORDER_ERROR_CODES.INVALID_TAX_PERCENT);
	}
}
