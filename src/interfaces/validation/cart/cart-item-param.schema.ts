import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const cartItemParamSchema = z.object({
	cartId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ID }),
	cartItemId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ITEM_ID }),
});

export type CartItemParam = z.infer<typeof cartItemParamSchema>;
