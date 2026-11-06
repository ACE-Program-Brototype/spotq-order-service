import type { PAYMENT_EVENTS } from "@shared/constants/events.constants.ts";

export interface BasePaymentEventDTO {
	eventType: string;
	orderId?: string | undefined;
	aggregateId?: string | undefined;
}

export interface PaymentOrderCapturedEventDTO {
	eventId?: string | undefined;
	eventType: typeof PAYMENT_EVENTS.ORDER_CAPTURED;
	aggregateId?: string | undefined;
	orderId: string;
	paymentId?: string | undefined;
	customerId?: string | undefined;
	restaurantId?: string | undefined;
	amountPaise?: number | undefined;
	currency?: string | undefined;
	gatewayPaymentId?: string | null | undefined;
	method?: string | undefined;
	timestamp?: string | undefined;
}

export interface PaymentOrderFailedEventDTO {
	eventId?: string | undefined;
	eventType: typeof PAYMENT_EVENTS.ORDER_FAILED;
	aggregateId?: string | undefined;
	orderId: string;
	paymentId?: string | undefined;
	customerId?: string | undefined;
	restaurantId?: string | undefined;
	amountPaise?: number | undefined;
	currency?: string | undefined;
	failureReason?: string | null | undefined;
	timestamp?: string | undefined;
}
