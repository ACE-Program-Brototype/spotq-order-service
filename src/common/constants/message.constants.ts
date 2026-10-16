export const messages = {
	SUCCESS: "Request processed successfully",
	INTERNAL_SERVER_ERROR: "Internal Server Error",
	UNHANDLED_APP_ERROR: "Unhandled application error",
	INCOMMING_HTTP_REQ: "Incoming HTTP Request",
	OUTGOING_HTTP_RES: "Outgoing HTTP Response",
	REQ_ROUTE_NOT_FOUND: "Requested route not found",
	VALIDATION_ERROR: "Validation error occurred",
	UNAUTHORIZED: "Access token is missing, malformed, or expired",
	FORBIDDEN: "Forbidden access to this resource",
};

export const CART_MESSAGES = {
	FETCHED_SUCCESS: "Cart fetched successfully",
	ITEM_ADDED_SUCCESS: "Cart item added successfully",
	ITEM_UPDATED_SUCCESS: "Cart item quantity updated successfully",
	ITEM_NOT_FOUND: "Cart item not found in this cart",
	INVALID_CART_ITEM_ID: "Invalid cart item ID format",
	INVALID_UPDATE_QUANTITY: "Quantity must be an integer between 0 and 20",
	NOT_FOUND: "Cart with the given ID does not exist",
	EXPIRED: "Cart session has expired",
	UNAUTHORIZED_ACCESS: "Access to this cart is unauthorized",
	INVALID_CART_ID: "Invalid cart ID format",
	INVALID_RESTAURANT_ID: "Invalid restaurant ID format",
	INVALID_MENU_ITEM_ID: "Invalid menu item ID format",
	INVALID_VARIANT_ID: "Invalid variant ID format",
	INVALID_ADDON_ID: "Invalid addon ID format",
	INVALID_QUANTITY: "Quantity must be an integer between 1 and 20",
	INVALID_SPECIAL_INSTRUCTIONS:
		"Special instructions cannot exceed 250 characters",
	DIFFERENT_RESTAURANT:
		"Cannot add items from a different restaurant to an active cart",
	ITEM_UNAVAILABLE:
		"Selected item, variant, or add-on is currently unavailable",
	MENU_ITEM_NOT_FOUND: "Menu item not found in restaurant catalog",
};

export const CART_ERROR_CODES = {
	CART_NOT_FOUND: "CART_NOT_FOUND",
	CART_EXPIRED: "CART_EXPIRED",
	FORBIDDEN_CART_ACCESS: "FORBIDDEN_CART_ACCESS",
	DIFFERENT_RESTAURANT_CART: "DIFFERENT_RESTAURANT_CART",
	ITEM_UNAVAILABLE: "ITEM_UNAVAILABLE",
	MENU_ITEM_NOT_FOUND: "MENU_ITEM_NOT_FOUND",
	CART_ITEM_NOT_FOUND: "CART_ITEM_NOT_FOUND",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

export default messages;
