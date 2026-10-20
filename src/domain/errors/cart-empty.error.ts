import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class CartEmptyError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.CART_EMPTY) {
		super(message, ORDER_ERROR_CODES.CART_EMPTY);
	}
}
