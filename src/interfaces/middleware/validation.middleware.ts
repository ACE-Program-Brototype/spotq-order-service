import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";
import { type ZodType, z } from "zod";

export function validateRequestParams(schema: ZodType) {
	return async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			const parsed = await schema.parseAsync(req.params ?? {});
			req.params = parsed as Record<string, string>;
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const formattedErrors = error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				}));
				sendErrorResponse(
					res,
					messages.VALIDATION_ERROR,
					CART_ERROR_CODES.VALIDATION_ERROR,
					HTTP_STATUS.UNPROCESSABLE_ENTITY,
					formattedErrors,
				);
				return;
			}
			sendErrorResponse(
				res,
				messages.INTERNAL_SERVER_ERROR,
				CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
				HTTP_STATUS.INTERNAL_SERVER_ERROR,
			);
		}
	};
}

export function validateRequestBody(schema: ZodType) {
	return async (
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> => {
		try {
			req.body = await schema.parseAsync(req.body ?? {});
			next();
		} catch (error) {
			if (error instanceof z.ZodError) {
				const formattedErrors = error.issues.map((issue) => ({
					field: issue.path.join("."),
					message: issue.message,
				}));
				sendErrorResponse(
					res,
					messages.VALIDATION_ERROR,
					CART_ERROR_CODES.VALIDATION_ERROR,
					HTTP_STATUS.UNPROCESSABLE_ENTITY,
					formattedErrors,
				);
				return;
			}
			sendErrorResponse(
				res,
				messages.INTERNAL_SERVER_ERROR,
				CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
				HTTP_STATUS.INTERNAL_SERVER_ERROR,
			);
		}
	};
}
