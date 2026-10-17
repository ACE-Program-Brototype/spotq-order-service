import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const updateCartItemQuantityParamSchema = z.object({
	cartId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ID }),
	cartItemId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ITEM_ID }),
});

export const updateCartItemQuantityBodySchema = z.object({
	quantity: z
		.number({ invalid_type_error: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
		.int({ message: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
		.min(0, { message: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
		.max(20, { message: CART_MESSAGES.INVALID_UPDATE_QUANTITY }),
});

export type UpdateCartItemQuantityParam = z.infer<
	typeof updateCartItemQuantityParamSchema
>;
export type UpdateCartItemQuantityBody = z.infer<
	typeof updateCartItemQuantityBodySchema
>;

export default updateCartItemQuantityBodySchema;
