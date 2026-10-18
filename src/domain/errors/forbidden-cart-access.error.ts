import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";
export class ForbiddenCartAccessError extends DomainError {
	constructor(message: string = CART_MESSAGES.UNAUTHORIZED_ACCESS) {
		super(message, CART_ERROR_CODES.FORBIDDEN_CART_ACCESS);
	}
}

export default ForbiddenCartAccessError;
