import { AUTH_HEADERS } from "@common/constants/auth.constants.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";

export type { AuthenticatedUser } from "@/types/express.d.ts";

function getHeaderValue(
	header: string | string[] | undefined,
): string | undefined {
	if (Array.isArray(header)) {
		return header[0]?.trim();
	}
	return header?.trim();
}

export function customerAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const userId = getHeaderValue(req.headers[AUTH_HEADERS.USER_ID]);
	const role = getHeaderValue(req.headers[AUTH_HEADERS.USER_ROLE]);
	const email = getHeaderValue(req.headers[AUTH_HEADERS.USER_EMAIL]);
	const name = getHeaderValue(req.headers[AUTH_HEADERS.USER_NAME]);
	const phone = getHeaderValue(req.headers[AUTH_HEADERS.USER_PHONE]);

	if (!userId) {
		sendErrorResponse(
			res,
			messages.UNAUTHORIZED,
			CART_ERROR_CODES.UNAUTHORIZED,
			HTTP_STATUS.UNAUTHORIZED,
		);
		return;
	}

	req.user = {
		userId,
		role,
		email,
		name,
		phone,
	};

	next();
}
