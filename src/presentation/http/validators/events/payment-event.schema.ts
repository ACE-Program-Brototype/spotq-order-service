import type {
	BasePaymentEventDTO,
	PaymentOrderCapturedEventDTO,
	PaymentOrderFailedEventDTO,
} from "@application/dtos/events/payment-event.dto.ts";
import { PAYMENT_EVENTS } from "@shared/constants/events.constants.ts";
import { z } from "zod";

export const basePaymentEventSchema: z.ZodType<BasePaymentEventDTO> = z.object({
	eventType: z.string(),
	orderId: z.string().min(1).optional(),
	aggregateId: z.string().min(1).optional(),
});

export const paymentOrderCapturedEventSchema: z.ZodType<PaymentOrderCapturedEventDTO> =
	z.object({
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

export const paymentOrderFailedEventSchema: z.ZodType<PaymentOrderFailedEventDTO> =
	z.object({
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
