import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const getCustomerOrderDetailsParamSchema = z
	.object({
		orderId: z
			.string()
			.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_ORDER_ID }),
	})
	.strict();

export type GetCustomerOrderDetailsParam = z.infer<
	typeof getCustomerOrderDetailsParamSchema
>;
