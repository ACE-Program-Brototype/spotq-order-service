import { ORDER_LIMITS } from "@common/constants/limits.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const cancelOrderParamSchema = z.object({
	orderId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_ORDER_ID }),
});

export const cancelOrderBodySchema = z.object({
	cancellation_reason: z
		.string()
		.trim()
		.max(ORDER_LIMITS.MAX_CANCELLATION_REASON_LENGTH, {
			message: ORDER_MESSAGES.INVALID_CANCELLATION_REASON,
		})
		.optional()
		.nullable(),
});

export type CancelOrderParam = z.infer<typeof cancelOrderParamSchema>;
export type CancelOrderBody = z.infer<typeof cancelOrderBodySchema>;
