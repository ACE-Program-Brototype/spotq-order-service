export const ORDER_LIMITS = {
	DEFAULT_PRIORITY: 2,
	MAX_SPECIAL_INSTRUCTIONS_LENGTH: 250,
	MAX_USER_NAME_LENGTH: 100,
	MAX_USER_PHONE_LENGTH: 20,
	MAX_CANCELLATION_REASON_LENGTH: 500,
} as const;

export const ORDER_DEFAULTS = {
	ITEM_NAME: "Item",
	ADDON_NAME: "Addon",
	AUDIT_NOTE: "Order placed by customer",
	CANCEL_AUDIT_NOTE: "Order cancelled by customer",
} as const;

export const ORDER_DOMAIN_MESSAGES = {
	ORDER_FORBIDDEN_CANCEL: "Customers can only cancel their own orders",
	ORDER_ALREADY_CANCELLED: "Order is already cancelled",
	ORDER_ALREADY_IN_PREPARATION:
		"Order is already in preparation and cannot be cancelled",
	CART_EMPTY: "Cannot place an order with an empty cart",
	ORDER_NOT_FOUND: "Order not found",
} as const;
