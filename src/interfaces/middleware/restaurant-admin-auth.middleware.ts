import { AUTH_HEADERS } from "@common/constants/auth.constants.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	messages,
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";

const REQUIRED_ROLE = "RESTAURANT_OWNER";

export type { AuthenticatedRestaurantAdmin } from "@/types/express.d.ts";

function getHeaderValue(
	header: string | string[] | undefined,
): string | undefined {
	if (Array.isArray(header)) {
		return header[0];
	}
	return header;
}

export function restaurantAdminAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const headerUserId = getHeaderValue(req.headers[AUTH_HEADERS.USER_ID]);
	const headerRestaurantId = getHeaderValue(
		req.headers[AUTH_HEADERS.RESTAURANT_ID],
	);
	const role = getHeaderValue(req.headers[AUTH_HEADERS.USER_ROLE]);
	const email = getHeaderValue(req.headers[AUTH_HEADERS.USER_EMAIL]);

	const restaurantId = headerRestaurantId || headerUserId;

	if (!restaurantId) {
		sendErrorResponse(
			res,
			messages.UNAUTHORIZED,
			ORDER_ERROR_CODES.UNAUTHORIZED,
			HTTP_STATUS.UNAUTHORIZED,
		);
		return;
	}

	const userId = headerUserId || restaurantId;

	if (role !== REQUIRED_ROLE) {
		sendErrorResponse(
			res,
			messages.FORBIDDEN,
			ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS,
			HTTP_STATUS.FORBIDDEN,
		);
		return;
	}

	if (req.params.restaurantId && req.params.restaurantId !== restaurantId) {
		sendErrorResponse(
			res,
			ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS,
			ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS,
			HTTP_STATUS.FORBIDDEN,
		);
		return;
	}

	req.restaurantAdmin = {
		userId,
		restaurantId,
		role,
		email,
	};

	next();
}

export default restaurantAdminAuthMiddleware;
