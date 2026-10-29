import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@shared/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";
export class ForbiddenCartAccessError extends DomainError {
	constructor(message: string = CART_MESSAGES.UNAUTHORIZED_ACCESS) {
		super(message, CART_ERROR_CODES.FORBIDDEN_CART_ACCESS);
	}
}
