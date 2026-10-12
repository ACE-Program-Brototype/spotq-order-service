import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
	userId: string;
	role?: string | undefined;
	email?: string | undefined;
}

declare global {
	namespace Express {
		interface Request {
			user?: AuthenticatedUser;
		}
	}
}

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
	const headerUserId = getHeaderValue(req.headers["x-user-id"]);
	const headerRole = getHeaderValue(req.headers["x-user-role"]);
	const headerEmail = getHeaderValue(req.headers["x-user-email"]);

	let userId = headerUserId;
	let role = headerRole;
	let email = headerEmail;

	if (!userId && req.headers.authorization) {
		const authHeader = getHeaderValue(req.headers.authorization);
		if (authHeader?.startsWith("Bearer ")) {
			const token = authHeader.substring(7).trim();
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

export default customerAuthMiddleware;
