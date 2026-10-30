import {
	CART_ERROR_CODES,
	CART_MESSAGES,
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class CartEmptyError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.CART_EMPTY) {
		super(message, ORDER_ERROR_CODES.CART_EMPTY);
	}
}

export class CartExpiredError extends DomainError {
	constructor(message: string = CART_MESSAGES.EXPIRED) {
		super(message, CART_ERROR_CODES.CART_EXPIRED);
	}
}

export class CartItemNotFoundError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.CART_ITEM_NOT_FOUND;

	constructor(message: string = CART_MESSAGES.ITEM_NOT_FOUND) {
		super(message, CART_ERROR_CODES.CART_ITEM_NOT_FOUND);
	}
}

export class CartNotFoundError extends DomainError {
	constructor(message: string = CART_MESSAGES.NOT_FOUND) {
		super(message, CART_ERROR_CODES.CART_NOT_FOUND);
	}
}

export class DifferentRestaurantCartError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART;

	constructor(message: string = CART_MESSAGES.DIFFERENT_RESTAURANT) {
		super(message, CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART);
	}
}

export class ForbiddenCartAccessError extends DomainError {
	constructor(message: string = CART_MESSAGES.UNAUTHORIZED_ACCESS) {
		super(message, CART_ERROR_CODES.FORBIDDEN_CART_ACCESS);
	}
}

export class InvalidCartQuantityError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.VALIDATION_ERROR;

	constructor(message: string = CART_MESSAGES.INVALID_QUANTITY) {
		super(message, CART_ERROR_CODES.VALIDATION_ERROR);
	}
}

export class ItemUnavailableError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.ITEM_UNAVAILABLE;

	constructor(message: string = CART_MESSAGES.ITEM_UNAVAILABLE) {
		super(message, CART_ERROR_CODES.ITEM_UNAVAILABLE);
	}
}

export class MenuItemNotFoundError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.MENU_ITEM_NOT_FOUND;

	constructor(message: string = CART_MESSAGES.MENU_ITEM_NOT_FOUND) {
		super(message, CART_ERROR_CODES.MENU_ITEM_NOT_FOUND);
	}
}
