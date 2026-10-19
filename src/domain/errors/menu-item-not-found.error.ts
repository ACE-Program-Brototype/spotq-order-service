import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { DomainError } from "./domain.error.ts";

export class MenuItemNotFoundError extends DomainError {
	public readonly errorCode = CART_ERROR_CODES.MENU_ITEM_NOT_FOUND;

	constructor(message: string = CART_MESSAGES.MENU_ITEM_NOT_FOUND) {
		super(message, CART_ERROR_CODES.MENU_ITEM_NOT_FOUND);
	}
}

export default MenuItemNotFoundError;
