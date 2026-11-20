import env from "@config/env.ts";
import { S2S_CALLER_SERVICES } from "@shared/constants/auth.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ApiResponse } from "@shared/responses/api-response.ts";
import { authMiddleware, type TokenVerifierConfig } from "@spotq-org/s2s-core";
import type { NextFunction, Request, RequestHandler, Response } from "express";

export function internalS2SAuthMiddleware(): RequestHandler {
	const verifierConfig: TokenVerifierConfig = {
		expectedAudience: env.S2S_AUDIENCE,
		getPublicKey: (callerService: string) => {
			const publicKeyMap: Record<string, string | undefined> = {
				[S2S_CALLER_SERVICES.RESTAURANT_SERVICE]: env.RESTAURANT_S2S_PUBLIC_KEY,
			};
			return publicKeyMap[callerService] ?? null;
		},
	};

	return authMiddleware(verifierConfig);
}

export function requireCallerService(
	allowedServices: string | string[],
): RequestHandler {
	const allowed = Array.isArray(allowedServices)
		? allowedServices
		: [allowedServices];

	return (req: Request, res: Response, next: NextFunction): void => {
		if (!req.callerService || !allowed.includes(req.callerService)) {
			res
				.status(HttpStatus.FORBIDDEN)
				.json(
					ApiResponse.error(
						`Caller '${req.callerService ?? "UNKNOWN"}' is not authorized to access this resource`,
						"FORBIDDEN",
						HttpStatus.FORBIDDEN,
					),
				);
			return;
		}
		next();
	};
}
