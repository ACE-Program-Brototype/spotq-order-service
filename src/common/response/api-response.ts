import {
	HTTP_STATUS,
	type HttpStatusCode,
} from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import type { Response } from "express";

export interface ApiResponseSuccess<T = unknown> {
	success: true;
	statusCode: number;
	message: string;
	data: T;
}

export interface ApiResponseError {
	success: false;
	statusCode: number;
	message: string;
	code: string;
	error?: unknown;
}

export const ApiResponse = {
	ok<T>(
		data: T,
		message: string = messages.SUCCESS,
		statusCode: HttpStatusCode = HTTP_STATUS.OK,
	): ApiResponseSuccess<T> {
		return {
			success: true,
			statusCode,
			message,
			data,
		};
	},

	error(
		message: string,
		code = CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
		statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
		error?: unknown,
	): ApiResponseError {
		return {
			success: false,
			statusCode,
			message,
			code,
			error,
		};
	},
};

export function sendSuccessResponse<T>(
	res: Response,
	data: T,
	message: string = messages.SUCCESS,
	statusCode: HttpStatusCode = HTTP_STATUS.OK,
): Response {
	return res.status(statusCode).json(ApiResponse.ok(data, message, statusCode));
}

export function sendErrorResponse(
	res: Response,
	message: string,
	code = CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
	statusCode: HttpStatusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR,
	error?: unknown,
): Response {
	return res
		.status(statusCode)
		.json(ApiResponse.error(message, code, statusCode, error));
}
