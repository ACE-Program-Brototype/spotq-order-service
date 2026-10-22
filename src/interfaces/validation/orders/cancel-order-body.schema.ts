import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { z } from "zod";

export const cancelOrderBodySchema = z.object({
	cancellation_reason: z
		.string()
		.trim()
		.max(500, { message: ORDER_MESSAGES.INVALID_CANCELLATION_REASON })
		.optional()
		.nullable(),
});

export type CancelOrderBody = z.infer<typeof cancelOrderBodySchema>;

export default cancelOrderBodySchema;
