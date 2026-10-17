import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";

export class RestaurantNotFoundError extends Error {
	constructor(message: string = ORDER_MESSAGES.RESTAURANT_NOT_FOUND) {
		super(message);
		this.name = "RestaurantNotFoundError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default RestaurantNotFoundError;
