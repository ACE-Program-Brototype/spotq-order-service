import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class ForbiddenOrderAccessError extends DomainError {
	constructor(message: string = ORDER_MESSAGES.ORDER_FORBIDDEN_CANCEL) {
		super(message, ORDER_ERROR_CODES.FORBIDDEN);
	}
}

export default ForbiddenOrderAccessError;
