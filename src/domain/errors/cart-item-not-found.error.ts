import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class CartItemNotFoundError extends Error {
	constructor(message: string = CART_MESSAGES.ITEM_NOT_FOUND) {
		super(message);
		this.name = "CartItemNotFoundError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default CartItemNotFoundError;
