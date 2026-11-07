export const QUEUES = {
	ORDER_EVENTS: "order-events",
	PAYMENT_EVENTS: "payment-events",
} as const;

export type QueueName = (typeof QUEUES)[keyof typeof QUEUES];

export const PAYMENT_EVENTS = {
	ORDER_CAPTURED: "payment.order.captured",
	ORDER_FAILED: "payment.order.failed",
} as const;

export const ORDER_EVENTS = {
	PAYMENT_INVOICE: "order.payment.invoice",
} as const;

export type PaymentEventType =
	(typeof PAYMENT_EVENTS)[keyof typeof PAYMENT_EVENTS];

export type OrderEventType = (typeof ORDER_EVENTS)[keyof typeof ORDER_EVENTS];
