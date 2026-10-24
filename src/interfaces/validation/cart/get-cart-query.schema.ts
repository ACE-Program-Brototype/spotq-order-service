import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const getCartQuerySchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_RESTAURANT_ID })
		.optional(),
});

export type GetCartQuery = z.infer<typeof getCartQuerySchema>;
