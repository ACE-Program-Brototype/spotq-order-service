export const SERVICES = {
	RESTAURANT_SERVICE: "restaurant-service",
	QUEUE_SERVICE: "queue-service",
	PAYMENT_SERVICE: "payment-service",
} as const;

export const PAYMENT_CIRCUIT_BREAKER = {
	GATEWAY_ORDER: {
		NAME: "payment-service-gateway-order",
		ENDPOINT_TAG: "POST /api/internal/v1/payments/gateway-order",
	},
	REFUND: {
		NAME: "payment-service-refund",
		ENDPOINT_TAG: "POST /api/internal/v1/payments/refunds",
	},
} as const;

export const PAYMENT_REFUND_DEFAULTS = {
	ALREADY_REFUNDED_ID: "ALREADY_REFUNDED",
	STATUS_PROCESSED: "PROCESSED",
} as const;

export const PAYMENT_CLIENT_MESSAGES = {
	GATEWAY_DRAFT_FAILED: "Payment service gateway draft creation failed",
	REFUND_FAILED: "Payment service refund processing failed",
	SERVICE_UNAVAILABLE: "Payment service unavailable",
	HTTP_ERROR: (status: number | string) =>
		`Payment service returned HTTP ${status}`,
} as const;

export default SERVICES;
