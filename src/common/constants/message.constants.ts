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
	NOT_FOUND: "Cart with the given ID does not exist",
	EXPIRED: "Cart session has expired",
	UNAUTHORIZED_ACCESS: "Access to this cart is unauthorized",
	INVALID_CART_ID: "Invalid cart ID format",
};

export const CART_ERROR_CODES = {
	CART_NOT_FOUND: "CART_NOT_FOUND",
	CART_EXPIRED: "CART_EXPIRED",
	FORBIDDEN_CART_ACCESS: "FORBIDDEN_CART_ACCESS",
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
};

export const ORDER_ERROR_CODES = {
	RESTAURANT_NOT_FOUND: "RESTAURANT_NOT_FOUND",
	RESTAURANT_NOT_ELIGIBLE: "RESTAURANT_NOT_ELIGIBLE",
	FORBIDDEN_RESTAURANT_ACCESS: "FORBIDDEN_RESTAURANT_ACCESS",
	VALIDATION_ERROR: "VALIDATION_ERROR",
	UNAUTHORIZED: "UNAUTHORIZED",
	INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
};

export default messages;
