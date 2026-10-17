import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { sendErrorResponse } from "@common/response/api-response.ts";
import {
	DOMAIN_ERROR_HTTP_MAP,
	mapDomainErrorToHttpStatus,
} from "@common/utils/domain-error-mapper.util.ts";
import { DomainError } from "@domain/errors/domain.error.ts";
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
		sendErrorResponse(res, err.message, err.errorCode, statusCode);
		return;
	}

	sendErrorResponse(
		res,
		err instanceof Error ? err.message : messages.INTERNAL_SERVER_ERROR,
		CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
		HTTP_STATUS.INTERNAL_SERVER_ERROR,
	);
}

export default errorHandler;
