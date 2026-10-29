import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class ItemUnavailableError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.ITEM_UNAVAILABLE;

	constructor(message: string = CART_MESSAGES.ITEM_UNAVAILABLE) {
		super(message, CART_ERROR_CODES.ITEM_UNAVAILABLE);
	}
}
