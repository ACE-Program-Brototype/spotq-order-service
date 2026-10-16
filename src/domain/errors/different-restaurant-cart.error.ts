import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class DifferentRestaurantCartError extends Error {
	constructor(message: string = CART_MESSAGES.DIFFERENT_RESTAURANT) {
		super(message);
		this.name = "DifferentRestaurantCartError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default DifferentRestaurantCartError;
