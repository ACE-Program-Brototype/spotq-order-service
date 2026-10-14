import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class CartExpiredError extends Error {
	constructor(message: string = CART_MESSAGES.EXPIRED) {
		super(message);
		this.name = "CartExpiredError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default CartExpiredError;
