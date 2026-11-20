import { CART_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const cartItemParamSchema = z
	.object({
		cartId: z
			.string()
			.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ID }),
		cartItemId: z
			.string()
			.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ITEM_ID }),
	})
	.strict();

export type CartItemParam = z.infer<typeof cartItemParamSchema>;
