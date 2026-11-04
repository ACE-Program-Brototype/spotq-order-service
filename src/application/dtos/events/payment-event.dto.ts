import { PAYMENT_EVENTS } from "@shared/constants/events.constants.ts";
import { z } from "zod";

export const basePaymentEventSchema = z.object({
	eventType: z.string(),
	orderId: z.string().min(1).optional(),
	aggregateId: z.string().min(1).optional(),
});

export type BasePaymentEventDTO = z.infer<typeof basePaymentEventSchema>;

export const paymentOrderCapturedEventSchema = z.object({
	eventId: z.string().optional(),
	eventType: z.literal(PAYMENT_EVENTS.ORDER_CAPTURED),
	aggregateId: z.string().optional(),
	orderId: z.string().min(1),
	paymentId: z.string().optional(),
	customerId: z.string().optional(),
	restaurantId: z.string().optional(),
	amountPaise: z.number().int().positive().optional(),
	currency: z.string().optional(),
	gatewayPaymentId: z.string().nullable().optional(),
	method: z.string().optional(),
	timestamp: z.string().optional(),
});

export type PaymentOrderCapturedEventDTO = z.infer<
	typeof paymentOrderCapturedEventSchema
>;

export const paymentOrderFailedEventSchema = z.object({
	eventId: z.string().optional(),
	eventType: z.literal(PAYMENT_EVENTS.ORDER_FAILED),
	aggregateId: z.string().optional(),
	orderId: z.string().min(1),
	paymentId: z.string().optional(),
	customerId: z.string().optional(),
	restaurantId: z.string().optional(),
	amountPaise: z.number().int().positive().optional(),
	currency: z.string().optional(),
	failureReason: z.string().nullable().optional(),
	timestamp: z.string().optional(),
});

export type PaymentOrderFailedEventDTO = z.infer<
	typeof paymentOrderFailedEventSchema
>;
