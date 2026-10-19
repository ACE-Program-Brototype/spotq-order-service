import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class InvalidCartQuantityError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.VALIDATION_ERROR;

	constructor(message: string = CART_MESSAGES.INVALID_QUANTITY) {
		super(message, CART_ERROR_CODES.VALIDATION_ERROR);
	}
}

export default InvalidCartQuantityError;
