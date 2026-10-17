import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";

export class ForbiddenRestaurantAccessError extends Error {
	constructor(message: string = ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS) {
		super(message);
		this.name = "ForbiddenRestaurantAccessError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default ForbiddenRestaurantAccessError;
