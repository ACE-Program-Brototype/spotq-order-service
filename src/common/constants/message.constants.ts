import { AUTH_ROLES } from "./auth.constants.ts";

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
	ITEM_REMOVED_SUCCESS: "Cart item removed successfully",
	CART_CLEARED_SUCCESS: "Cart cleared successfully",
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
	DUPLICATE_ADDON_ID: "Duplicate addon IDs are not allowed",
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

export const ORDER_MESSAGES = {
	OVERVIEW_FETCHED_SUCCESS: "Restaurant orders overview retrieved successfully",
	RESTAURANT_NOT_FOUND: "Restaurant not found",
	RESTAURANT_NOT_ELIGIBLE: "Restaurant is not eligible to process orders",
	FORBIDDEN_RESTAURANT_ACCESS:
		"Access to this restaurant's orders is forbidden",
	INVALID_RESTAURANT_ID: "Invalid restaurant ID format",
	INVALID_FROM_DATE:
		"Invalid 'from' date format. Expected valid ISO date or YYYY-MM-DD",
	INVALID_TO_DATE:
		"Invalid 'to' date format. Expected valid ISO date or YYYY-MM-DD",
	INVALID_ORDER_STATUS: "Invalid order status filter provided",
	RESTAURANT_VALIDATION_FAILED:
		"Failed to validate restaurant from restaurant-service",
	HISTORY_FETCHED_SUCCESS: "Order history retrieved successfully",
	CANCEL_SUCCESS: "Order cancelled successfully",
	ORDER_NOT_FOUND: "Order not found",
	ORDER_ALREADY_IN_PREPARATION:
		"Order is already in preparation and cannot be cancelled",
	ORDER_ALREADY_CANCELLED: "Order is already cancelled",
	ORDER_FORBIDDEN_CANCEL: "Customers can only cancel their own orders",
	INVALID_ORDER_ID: "Invalid order ID format",
	INVALID_CANCELLATION_REASON:
		"Cancellation reason cannot exceed 500 characters",
	CART_EMPTY: "Cannot place an order with an empty cart",
	DEFAULT_CANCEL_REASON: "Order cancelled by customer",
};

export const ORDER_DEFAULTS = {
	ITEM_NAME: "Item",
	ADDON_NAME: "Addon",
	AUDIT_NOTE: "Order placed by customer",
	CANCEL_AUDIT_NOTE: "Order cancelled by customer",
	CHANGED_BY_CUSTOMER: AUTH_ROLES.CUSTOMER,
} as const;

export const ORDER_ERROR_CODES = {
	RESTAURANT_NOT_FOUND: "RESTAURANT_NOT_FOUND",
	RESTAURANT_NOT_ELIGIBLE: "RESTAURANT_NOT_ELIGIBLE",
	FORBIDDEN_RESTAURANT_ACCESS: "FORBIDDEN_RESTAURANT_ACCESS",
	FORBIDDEN: "FORBIDDEN",
	ORDER_NOT_FOUND: "ORDER_NOT_FOUND",
	ORDER_CANNOT_BE_CANCELLED: "ORDER_CANNOT_BE_CANCELLED",
	INVALID_ORDER_ID: "INVALID_ORDER_ID",
	CART_EMPTY: "CART_EMPTY",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

export default messages;
