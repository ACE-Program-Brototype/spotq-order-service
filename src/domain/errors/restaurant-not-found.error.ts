import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class RestaurantNotFoundError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.RESTAURANT_NOT_FOUND) {
		super(message, ORDER_ERROR_CODES.RESTAURANT_NOT_FOUND);
	}
}

export default RestaurantNotFoundError;
