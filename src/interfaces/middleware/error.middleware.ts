import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import type { NextFunction, Request, Response } from "express";

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof CartNotFoundError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.CART_NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
		);
		return;
	}

	if (err instanceof CartItemNotFoundError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.CART_ITEM_NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
		);
		return;
	}

	if (err instanceof CartExpiredError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.CART_EXPIRED,
			HTTP_STATUS.GONE,
		);
		return;
	}

	if (err instanceof ForbiddenCartAccessError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.FORBIDDEN_CART_ACCESS,
			HTTP_STATUS.FORBIDDEN,
		);
		return;
	}

	if (err instanceof DifferentRestaurantCartError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART,
			HTTP_STATUS.CONFLICT,
		);
		return;
	}

	if (err instanceof ItemUnavailableError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.ITEM_UNAVAILABLE,
			HTTP_STATUS.CONFLICT,
		);
		return;
	}

	if (err instanceof MenuItemNotFoundError) {
		sendErrorResponse(
			res,
			err.message,
			CART_ERROR_CODES.MENU_ITEM_NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
		);
		return;
	}

	sendErrorResponse(
		res,
		err instanceof Error ? err.message : messages.INTERNAL_SERVER_ERROR,
		CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
		HTTP_STATUS.INTERNAL_SERVER_ERROR,
	);
}

export default errorHandler;
