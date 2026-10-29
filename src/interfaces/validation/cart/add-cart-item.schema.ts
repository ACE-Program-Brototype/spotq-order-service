import { CART_LIMITS } from "@shared/constants/limits.constants.ts";
import { CART_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const addCartItemBodySchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_RESTAURANT_ID }),
	menuItemId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_MENU_ITEM_ID }),
	variantId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_VARIANT_ID })
		.nullable()
		.optional(),
	addonIds: z
		.array(
			z.string().regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_ADDON_ID }),
		)
		.refine((items) => new Set(items).size === items.length, {
			message: CART_MESSAGES.DUPLICATE_ADDON_ID,
		})
		.optional()
		.default([]),
	quantity: z
		.number()
		.int({ message: CART_MESSAGES.INVALID_QUANTITY })
		.min(CART_LIMITS.MIN_QUANTITY, { message: CART_MESSAGES.INVALID_QUANTITY })
		.max(CART_LIMITS.MAX_QUANTITY, { message: CART_MESSAGES.INVALID_QUANTITY }),
	specialInstructions: z
		.string()
		.max(CART_LIMITS.MAX_SPECIAL_INSTRUCTIONS_LENGTH, {
			message: CART_MESSAGES.INVALID_SPECIAL_INSTRUCTIONS,
		})
		.nullable()
		.optional(),
});

export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;
