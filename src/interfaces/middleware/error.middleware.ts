import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import { DomainError } from "@domain/errors/domain.error.ts";
import type { NextFunction, Request, Response } from "express";

export const DOMAIN_ERROR_HTTP_MAP: Record<string, number> = {
	[CART_ERROR_CODES.CART_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
	[CART_ERROR_CODES.CART_ITEM_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
	[CART_ERROR_CODES.MENU_ITEM_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
	[CART_ERROR_CODES.CART_EXPIRED]: HTTP_STATUS.GONE,
	[CART_ERROR_CODES.FORBIDDEN_CART_ACCESS]: HTTP_STATUS.FORBIDDEN,
	[CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART]: HTTP_STATUS.CONFLICT,
	[CART_ERROR_CODES.ITEM_UNAVAILABLE]: HTTP_STATUS.CONFLICT,
};

export function mapDomainErrorToHttpStatus(errorCode: string): number {
	return DOMAIN_ERROR_HTTP_MAP[errorCode] ?? HTTP_STATUS.BAD_REQUEST;
}

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof DomainError) {
		const statusCode = mapDomainErrorToHttpStatus(err.errorCode);
		sendErrorResponse(res, err.message, err.errorCode, statusCode);
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
