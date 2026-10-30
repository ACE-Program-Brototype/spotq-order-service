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

export class ForbiddenOrderAccessError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.ORDER_FORBIDDEN_CANCEL) {
		super(message, ORDER_ERROR_CODES.FORBIDDEN);
	}
}

export class OrderCancellationNotAllowedError extends DomainError {
	constructor(
		message: string = ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION,
		code: string = ORDER_ERROR_CODES.ORDER_CANNOT_BE_CANCELLED,
	) {
		super(message, code);
	}
}

export class InvalidPaymentModeError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.INVALID_PAYMENT_MODE) {
		super(message, ORDER_ERROR_CODES.INVALID_PAYMENT_MODE);
	}
}

export class RestaurantNotFoundError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.RESTAURANT_NOT_FOUND) {
		super(message, ORDER_ERROR_CODES.RESTAURANT_NOT_FOUND);
	}
}

export class RestaurantNotEligibleError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.RESTAURANT_NOT_ELIGIBLE) {
		super(message, ORDER_ERROR_CODES.RESTAURANT_NOT_ELIGIBLE);
	}
}

export class ForbiddenRestaurantAccessError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS) {
		super(message, ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS);
	}
}
