import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const cancelOrderParamSchema = z.object({
	orderId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_ORDER_ID }),
});

export type CancelOrderParam = z.infer<typeof cancelOrderParamSchema>;

export default cancelOrderParamSchema;
