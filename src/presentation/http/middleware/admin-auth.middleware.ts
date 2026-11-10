import type { NextFunction, Request, Response } from "express";
import { HTTP_STATUS } from "@/shared/constants/http.constants.ts";
import { messages } from "@/shared/constants/message.constants.ts";
import { ApiResponse } from "@/shared/response/api-response.ts";

function getHeaderValue(
	header: string | string[] | undefined,
): string | undefined {
	if (Array.isArray(header)) {
		return header[0]?.trim();
	}
	return header?.trim();
}

const ALLOWED_ADMIN_ROLES = new Set(["admin"]);

export function adminAuthMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): void {
	const userId = getHeaderValue(req.headers["x-user-id"]);

	if (!userId) {
		res
			.status(HTTP_STATUS.UNAUTHORIZED)
			.json(
				ApiResponse.error(
					messages.GATEWAY_UNAUTHORIZED,
					"UNAUTHORIZED",
					HTTP_STATUS.UNAUTHORIZED,
				),
			);
		return;
	}

	const role = getHeaderValue(req.headers["x-user-role"]);
	const normalizedRole = role?.toLowerCase().trim();

	if (!normalizedRole || !ALLOWED_ADMIN_ROLES.has(normalizedRole)) {
		res
			.status(HTTP_STATUS.FORBIDDEN)
			.json(
				ApiResponse.error(
					messages.ADMIN_FORBIDDEN,
					"FORBIDDEN",
					HTTP_STATUS.FORBIDDEN,
				),
			);
		return;
	}

	const email = getHeaderValue(req.headers["x-user-email"]);

	req.user = {
		userId,
		email: email || "",
		role: normalizedRole,
	};

	next();
}
