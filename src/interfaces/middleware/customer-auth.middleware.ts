import {
	AUTH_CONSTANTS,
	AUTH_HEADERS,
} from "@common/constants/auth.constants.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export type { AuthenticatedUser } from "@/types/express.d.ts";

function getHeaderValue(
	header: string | string[] | undefined,
): string | undefined {
	if (Array.isArray(header)) {
		return header[0];
	}
	return header;
}

export function customerAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const headerUserId = getHeaderValue(req.headers[AUTH_HEADERS.USER_ID]);
	const headerRole = getHeaderValue(req.headers[AUTH_HEADERS.USER_ROLE]);
	const headerEmail = getHeaderValue(req.headers[AUTH_HEADERS.USER_EMAIL]);

	let userId = headerUserId;
	let role = headerRole;
	let email = headerEmail;

	if (!userId && req.headers[AUTH_HEADERS.AUTHORIZATION]) {
		const authHeader = getHeaderValue(req.headers[AUTH_HEADERS.AUTHORIZATION]);
		if (authHeader?.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
			const token = authHeader
				.substring(AUTH_CONSTANTS.BEARER_PREFIX_LENGTH)
				.trim();
			try {
				const decoded = jwt.decode(token) as {
					sub?: string;
					id?: string;
					userId?: string;
					role?: string;
					email?: string;
				} | null;

				if (decoded) {
					userId = decoded.sub || decoded.userId || decoded.id;
					if (!role && decoded.role) role = decoded.role;
					if (!email && decoded.email) email = decoded.email;
				}
			} catch {
				sendErrorResponse(
					res,
					messages.UNAUTHORIZED,
					CART_ERROR_CODES.UNAUTHORIZED,
					HTTP_STATUS.UNAUTHORIZED,
				);
				return;
			}
		}
	}

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
	};

	next();
}
