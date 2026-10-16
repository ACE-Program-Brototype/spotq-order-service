import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class ItemUnavailableError extends Error {
	constructor(message: string = CART_MESSAGES.ITEM_UNAVAILABLE) {
		super(message);
		this.name = "ItemUnavailableError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default ItemUnavailableError;
