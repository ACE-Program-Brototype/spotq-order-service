import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class DifferentRestaurantCartError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART;

	constructor(message: string = CART_MESSAGES.DIFFERENT_RESTAURANT) {
		super(message, CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART);
	}
}

export default DifferentRestaurantCartError;
