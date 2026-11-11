import { OrderStatus } from "@domain/enums/order-status.enum.ts";

export const ORDER_LIMITS = {
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
	COMPLETED_AUDIT_NOTE: "Order completed successfully",
	STATUS_UPDATED_AUDIT_NOTE: (from: string, to: string) =>
		`Order status updated from ${from} to ${to}`,
	DEFAULT_CANCELLATION_REASON: "CUSTOMER_CANCELLED",
	REFUND_NOTES_TEMPLATE: (orderNumber: string) =>
		`Customer cancelled order ${orderNumber}`,
	REFUND_AUDIT_NOTE_TEMPLATE: (refundId: string) =>
		`Order cancelled by customer. Refund initiated: ${refundId}`,
} as const;

export const ORDER_DOMAIN_MESSAGES = {
	ORDER_FORBIDDEN_CANCEL: "Customers can only cancel their own orders",
	ORDER_ALREADY_CANCELLED: "Order is already cancelled",
	ORDER_ALREADY_IN_PREPARATION:
		"Order is already in preparation and cannot be cancelled",
	CART_EMPTY: "Cannot place an order with an empty cart",
	ORDER_NOT_FOUND: "Order not found",
	FORBIDDEN_RESTAURANT_ACCESS:
		"Forbidden: Order does not belong to your restaurant",
	INVALID_STATUS_TRANSITION: "Invalid order status transition",
	INVALID_STATUS_TRANSITION_TEMPLATE: (from: string, to: string) =>
		`Cannot transition order status from ${from} to ${to}`,
	INVALID_PAYMENT_STATUS_TRANSITION_TEMPLATE: (from: string, to: string) =>
		`Cannot transition payment status from ${from} to ${to}`,
	ORDER_STATUS_CONFLICT:
		"Order was updated concurrently or is no longer in expected status",
} as const;

export const ALLOWED_STATUS_TRANSITIONS: Record<
	OrderStatus,
	readonly OrderStatus[]
> = {
	[OrderStatus.PLACED]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
	[OrderStatus.CONFIRMED]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
	[OrderStatus.PREPARING]: [OrderStatus.READY],
	[OrderStatus.READY]: [OrderStatus.SERVED, OrderStatus.COMPLETED],
	[OrderStatus.SERVED]: [OrderStatus.COMPLETED],
	[OrderStatus.COMPLETED]: [],
	[OrderStatus.CANCELLED]: [],
};
