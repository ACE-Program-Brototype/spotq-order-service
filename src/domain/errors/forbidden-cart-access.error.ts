import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class ForbiddenCartAccessError extends Error {
	constructor(message: string = CART_MESSAGES.UNAUTHORIZED_ACCESS) {
		super(message);
		this.name = "ForbiddenCartAccessError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default ForbiddenCartAccessError;
