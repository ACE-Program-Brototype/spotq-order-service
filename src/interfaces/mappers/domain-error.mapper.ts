import {
	HTTP_STATUS,
	type HttpStatusCode,
} from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	ORDER_ERROR_CODES,
} from "@common/constants/message.constants.ts";
import type { DomainError } from "@domain/errors/domain.error.ts";

export interface MappedDomainError {
	statusCode: HttpStatusCode;
	errorCode: string;
	message: string;
}

export const DOMAIN_ERROR_STATUS_MAP: Record<string, HttpStatusCode> = {
	[CART_ERROR_CODES.CART_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
	[CART_ERROR_CODES.CART_EXPIRED]: HTTP_STATUS.GONE,
	[CART_ERROR_CODES.FORBIDDEN_CART_ACCESS]: HTTP_STATUS.FORBIDDEN,
	[ORDER_ERROR_CODES.RESTAURANT_NOT_FOUND]: HTTP_STATUS.NOT_FOUND,
	[ORDER_ERROR_CODES.RESTAURANT_NOT_ELIGIBLE]: HTTP_STATUS.FORBIDDEN,
	[ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS]: HTTP_STATUS.FORBIDDEN,
};

export function domainErrorMapper(err: DomainError): MappedDomainError {
	const statusCode =
		DOMAIN_ERROR_STATUS_MAP[err.errorCode] ?? HTTP_STATUS.BAD_REQUEST;

	return {
		statusCode,
		errorCode: err.errorCode,
		message: err.message,
	};
}

export default domainErrorMapper;
