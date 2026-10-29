import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class CartItemNotFoundError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.CART_ITEM_NOT_FOUND;

	constructor(message: string = CART_MESSAGES.ITEM_NOT_FOUND) {
		super(message, CART_ERROR_CODES.CART_ITEM_NOT_FOUND);
	}
}
