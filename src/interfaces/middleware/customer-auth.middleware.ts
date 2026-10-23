import { AUTH_HEADERS, AUTH_ROLES } from "@common/constants/auth.constants.ts";
import {
	messages,
	ORDER_ERROR_CODES,
} from "@common/constants/message.constants.ts";
import { ForbiddenError, UnauthorizedError } from "@common/errors/index.ts";
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
	_res: Response,
	next: NextFunction,
): void {
	const userId = getHeaderValue(req.headers[AUTH_HEADERS.USER_ID]);
	const role = getHeaderValue(req.headers[AUTH_HEADERS.USER_ROLE]);
	const email = getHeaderValue(req.headers[AUTH_HEADERS.USER_EMAIL]);
	const name = getHeaderValue(req.headers[AUTH_HEADERS.USER_NAME]);
	const phone = getHeaderValue(req.headers[AUTH_HEADERS.USER_PHONE]);

	if (!userId) {
		throw new UnauthorizedError(
			messages.UNAUTHORIZED,
			ORDER_ERROR_CODES.UNAUTHORIZED,
		);
	}

	if (role && role.toLocaleLowerCase() !== AUTH_ROLES.CUSTOMER.toLowerCase()) {
		throw new ForbiddenError(messages.FORBIDDEN, ORDER_ERROR_CODES.FORBIDDEN);
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
