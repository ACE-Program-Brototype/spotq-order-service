import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";
export class CartNotFoundError extends DomainError {
	constructor(message: string = CART_MESSAGES.NOT_FOUND) {
		super(message, CART_ERROR_CODES.CART_NOT_FOUND);
	}
}
