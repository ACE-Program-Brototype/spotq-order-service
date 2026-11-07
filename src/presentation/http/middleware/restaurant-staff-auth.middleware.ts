import { AUTH_HEADERS, AUTH_ROLES } from "@shared/constants/auth.constants.ts";
import { COMMON_ERROR_CODES } from "@shared/constants/error-code.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import {
	messages,
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { sendErrorResponse } from "@shared/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";

function getHeaderValue(
	header: string | string[] | undefined,
): string | undefined {
	if (Array.isArray(header)) {
		return header[0]?.trim();
	}
	return header?.trim();
}

export function restaurantStaffAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const userId = getHeaderValue(req.headers[AUTH_HEADERS.USER_ID]);
	const restaurantId = getHeaderValue(req.headers[AUTH_HEADERS.RESTAURANT_ID]);
	const role = getHeaderValue(req.headers[AUTH_HEADERS.USER_ROLE]);
	const email = getHeaderValue(req.headers[AUTH_HEADERS.USER_EMAIL]);

	if (!userId || !restaurantId) {
		sendErrorResponse(
			res,
			messages.UNAUTHORIZED,
			COMMON_ERROR_CODES.UNAUTHORIZED,
			HttpStatus.UNAUTHORIZED,
		);
		return;
	}

	const normalizedRole = role?.trim().toLowerCase();
	const isStaff = normalizedRole === AUTH_ROLES.STAFF.toLowerCase();

	if (!role || !isStaff) {
		sendErrorResponse(
			res,
			messages.FORBIDDEN,
			ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS,
			HttpStatus.FORBIDDEN,
		);
		return;
	}

	if (req.params.restaurantId && req.params.restaurantId !== restaurantId) {
		sendErrorResponse(
			res,
			ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS,
			ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS,
			HttpStatus.FORBIDDEN,
		);
		return;
	}

	req.user = {
		userId,
		restaurantId,
		role,
		email,
	};

	next();
}
