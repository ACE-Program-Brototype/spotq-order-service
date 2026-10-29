import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class OrderNotFoundError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.ORDER_NOT_FOUND) {
		super(message, ORDER_ERROR_CODES.ORDER_NOT_FOUND);
	}
}

export default OrderNotFoundError;
