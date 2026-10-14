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

export default messages;
