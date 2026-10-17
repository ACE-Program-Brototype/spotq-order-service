import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class ForbiddenRestaurantAccessError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS) {
		super(message, ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS);
	}
}

export default ForbiddenRestaurantAccessError;
