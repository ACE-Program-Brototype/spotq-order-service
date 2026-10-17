import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
	ORDER_ERROR_CODES,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ForbiddenRestaurantAccessError } from "@domain/errors/forbidden-restaurant-access.error.ts";
import { RestaurantNotEligibleError } from "@domain/errors/restaurant-not-eligible.error.ts";
import { RestaurantNotFoundError } from "@domain/errors/restaurant-not-found.error.ts";
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

	if (
		err instanceof CartNotFoundError ||
		err instanceof RestaurantNotFoundError
	) {
		sendErrorResponse(
			res,
			err.message,
			ORDER_ERROR_CODES.RESTAURANT_NOT_FOUND,
			HTTP_STATUS.NOT_FOUND,
		);
		return;
	}

	if (err instanceof RestaurantNotEligibleError) {
		sendErrorResponse(
			res,
			err.message,
			ORDER_ERROR_CODES.RESTAURANT_NOT_ELIGIBLE,
			HTTP_STATUS.FORBIDDEN,
		);
		return;
	}

	if (err instanceof ForbiddenRestaurantAccessError) {
		sendErrorResponse(
			res,
			err.message,
			ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS,
			HTTP_STATUS.FORBIDDEN,
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
