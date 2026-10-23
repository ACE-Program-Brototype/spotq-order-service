import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	messages,
	ORDER_ERROR_CODES,
} from "@common/constants/message.constants.ts";

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
		errorCode: string = ORDER_ERROR_CODES.UNAUTHORIZED,
	) {
		super(message, HTTP_STATUS.UNAUTHORIZED, errorCode);
	}
}

export class ForbiddenError extends AppError {
	constructor(
		message: string = messages.FORBIDDEN,
		errorCode: string = ORDER_ERROR_CODES.FORBIDDEN,
	) {
		super(message, HTTP_STATUS.FORBIDDEN, errorCode);
	}
}
