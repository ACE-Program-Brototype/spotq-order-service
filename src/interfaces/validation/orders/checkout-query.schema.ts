import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { z } from "zod";

export const checkoutQuerySchema = z.object({
	restaurantId: z
		.string()
		.trim()
		.min(1, { message: ORDER_MESSAGES.INVALID_RESTAURANT_ID })
		.optional(),
	cartId: z
		.string()
		.trim()
		.uuid({ message: ORDER_MESSAGES.INVALID_CART_ID })
		.optional(),
});

export type CheckoutQuery = z.infer<typeof checkoutQuerySchema>;
