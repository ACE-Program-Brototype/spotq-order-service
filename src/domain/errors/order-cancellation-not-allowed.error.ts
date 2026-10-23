import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class OrderCancellationNotAllowedError extends DomainError {
	constructor(
		message: string = ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION,
		code: string = ORDER_ERROR_CODES.ORDER_CANNOT_BE_CANCELLED,
	) {
		super(message, code);
	}
}

export default OrderCancellationNotAllowedError;
