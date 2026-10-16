import { CART_MESSAGES } from "@common/constants/message.constants.ts";

export class MenuItemNotFoundError extends Error {
	constructor(message: string = CART_MESSAGES.MENU_ITEM_NOT_FOUND) {
		super(message);
		this.name = "MenuItemNotFoundError";
		Object.setPrototypeOf(this, new.target.prototype);
	}
}

export default MenuItemNotFoundError;
