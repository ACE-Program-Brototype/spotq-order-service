import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const orderDetailsParamSchema = z
	.object({
		restaurantId: z
			.string()
			.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_RESTAURANT_ID }),
		orderId: z
			.string()
			.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_ORDER_ID }),
	})
	.strict();

export type OrderDetailsParam = z.infer<typeof orderDetailsParamSchema>;
