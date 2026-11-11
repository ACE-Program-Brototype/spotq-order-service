import { COMMON_ERROR_CODES } from "@shared/constants/error-code.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import {
	DOWNSTREAM_MESSAGES,
	messages,
} from "@shared/constants/message.constants.ts";

export abstract class AppError extends Error {
	public readonly statusCode: number;
	public readonly errorCode: string;
	public readonly code: string;
	public readonly isOperational: boolean;

	constructor(message: string, statusCode: number, errorCode: string) {
		super(message);
		this.name = this.constructor.name;
		this.statusCode = statusCode;
		this.errorCode = errorCode;
		this.code = errorCode;
		this.isOperational = true;
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export class UnauthorizedError extends AppError {
	constructor(
		message: string = messages.UNAUTHORIZED,
		errorCode: string = COMMON_ERROR_CODES.UNAUTHORIZED,
	) {
		super(message, HttpStatus.UNAUTHORIZED, errorCode);
	}
}

export class ForbiddenError extends AppError {
	constructor(
		message: string = messages.FORBIDDEN,
		errorCode: string = COMMON_ERROR_CODES.FORBIDDEN,
	) {
		super(message, HttpStatus.FORBIDDEN, errorCode);
	}
}

export class DownstreamServiceUnavailableError extends AppError {
	constructor(
		serviceName: string,
		message: string = DOWNSTREAM_MESSAGES.SERVICE_UNAVAILABLE(serviceName),
		errorCode: string = COMMON_ERROR_CODES.DOWNSTREAM_SERVICE_UNAVAILABLE,
	) {
		super(message, HttpStatus.SERVICE_UNAVAILABLE, errorCode);
	}
}

export class DownstreamServiceTimeoutError extends AppError {
	constructor(
		serviceName: string,
		message: string = DOWNSTREAM_MESSAGES.SERVICE_TIMEOUT(serviceName),
		errorCode: string = COMMON_ERROR_CODES.DOWNSTREAM_SERVICE_TIMEOUT,
	) {
		super(message, HttpStatus.GATEWAY_TIMEOUT, errorCode);
	}
}
