import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class CartExpiredError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.CART_EXPIRED;

	constructor(message: string = CART_MESSAGES.EXPIRED) {
		super(message);
	}
}

export default CartExpiredError;
