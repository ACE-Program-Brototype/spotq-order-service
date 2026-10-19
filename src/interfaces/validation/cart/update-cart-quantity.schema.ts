import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { cartItemParamSchema } from "@interfaces/validation/cart/cart-item-param.schema.ts";
import { z } from "zod";

export const updateCartItemQuantityParamSchema = cartItemParamSchema;

export const updateCartItemQuantityBodySchema = z.object({
	quantity: z
		.number({ message: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
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
