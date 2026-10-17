import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";

export class RestaurantNotEligibleError extends Error {
	constructor(message: string = ORDER_MESSAGES.RESTAURANT_NOT_ELIGIBLE) {
		super(message);
		this.name = "RestaurantNotEligibleError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default RestaurantNotEligibleError;
