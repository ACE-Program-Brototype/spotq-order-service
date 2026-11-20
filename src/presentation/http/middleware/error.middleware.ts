import { DomainError } from "@domain/errors/domain.error.ts";
import logger from "@infrastructure/observability/logger.ts";
import { COMMON_ERROR_CODES } from "@shared/constants/error-code.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { messages } from "@shared/constants/message.constants.ts";
import { AppError } from "@shared/errors/index.ts";
import { sendErrorResponse } from "@shared/response/api-response.ts";
import {
	DOMAIN_ERROR_HTTP_MAP,
	mapDomainErrorToHttpStatus,
} from "@shared/utils/domain-error-mapper.util.ts";
import type { NextFunction, Request, Response } from "express";

export { DOMAIN_ERROR_HTTP_MAP, mapDomainErrorToHttpStatus };

export function errorHandler(
	err: unknown,
	_req: Request,
	res: Response,
	_next: NextFunction,
): void {
	if (err instanceof DomainError) {
		const statusCode = mapDomainErrorToHttpStatus(err.errorCode);
		logger.warn({ err, errorCode: err.errorCode, statusCode }, err.message);
		sendErrorResponse(res, err.message, err.errorCode, statusCode);
		return;
	}

	if (err instanceof AppError) {
		logger.warn(
			{ err, errorCode: err.errorCode, statusCode: err.statusCode },
			err.message,
		);
		sendErrorResponse(res, err.message, err.errorCode, err.statusCode);
		return;
	}

	logger.error(
		{ err },
		err instanceof Error ? err.message : messages.INTERNAL_SERVER_ERROR,
	);
	sendErrorResponse(
		res,
		messages.INTERNAL_SERVER_ERROR,
		COMMON_ERROR_CODES.INTERNAL_SERVER_ERROR,
		HttpStatus.INTERNAL_SERVER_ERROR,
	);
}
