import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class CartNotFoundError extends Error {
	constructor(message: string = CART_MESSAGES.NOT_FOUND) {
		super(message);
		this.name = "CartNotFoundError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default CartNotFoundError;
