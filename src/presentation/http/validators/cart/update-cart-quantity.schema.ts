import { cartItemParamSchema } from "@presentation/http/validators/cart/cart-item-param.schema.ts";
import { CART_LIMITS } from "@shared/constants/limits.constants.ts";
import { CART_MESSAGES } from "@shared/constants/message.constants.ts";
import { z } from "zod";

export const updateCartItemQuantityParamSchema = cartItemParamSchema;

export const updateCartItemQuantityBodySchema = z
	.object({
		quantity: z
			.number({ message: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
			.int({ message: CART_MESSAGES.INVALID_UPDATE_QUANTITY })
			.min(CART_LIMITS.MIN_UPDATE_QUANTITY, {
				message: CART_MESSAGES.INVALID_UPDATE_QUANTITY,
			})
			.max(CART_LIMITS.MAX_QUANTITY, {
				message: CART_MESSAGES.INVALID_UPDATE_QUANTITY,
			}),
	})
	.strict();

export type UpdateCartItemQuantityParam = z.infer<
	typeof updateCartItemQuantityParamSchema
>;
export type UpdateCartItemQuantityBody = z.infer<
	typeof updateCartItemQuantityBodySchema
>;
