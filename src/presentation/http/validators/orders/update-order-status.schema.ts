import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { ORDER_LIMITS } from "@shared/constants/limits.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const updateOrderStatusParamSchema = z
	.object({
		orderId: z
			.string()
			.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_ORDER_ID }),
	})
	.strict();

export const updateOrderStatusBodySchema = z
	.object({
		status: z.enum(
			[
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.SERVED,
				OrderStatus.COMPLETED,
				OrderStatus.CANCELLED,
			] as const,
			{
				message: ORDER_MESSAGES.INVALID_ORDER_STATUS,
			},
		),
		notes: z
			.string()
			.trim()
			.max(ORDER_LIMITS.MAX_CANCELLATION_REASON_LENGTH, {
				message: ORDER_MESSAGES.INVALID_CANCELLATION_REASON,
			})
			.optional()
			.nullable(),
	})
	.strict();

export type UpdateOrderStatusParam = z.infer<
	typeof updateOrderStatusParamSchema
>;
export type UpdateOrderStatusBody = z.infer<typeof updateOrderStatusBodySchema>;
