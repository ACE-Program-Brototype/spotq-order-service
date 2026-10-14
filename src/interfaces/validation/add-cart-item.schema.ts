import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
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
		.optional()
		.default([]),
	quantity: z
		.number()
		.int({ message: CART_MESSAGES.INVALID_QUANTITY })
		.min(1, { message: CART_MESSAGES.INVALID_QUANTITY })
		.max(20, { message: CART_MESSAGES.INVALID_QUANTITY }),
	specialInstructions: z
		.string()
		.max(250, { message: CART_MESSAGES.INVALID_SPECIAL_INSTRUCTIONS })
		.nullable()
		.optional(),
});

export type AddCartItemBody = z.infer<typeof addCartItemBodySchema>;

export default addCartItemBodySchema;
