import { CART_LIMITS } from "@common/constants/limits.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const batchCartItemSchema = z
	.object({
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
				z
					.string()
					.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_ADDON_ID }),
			)
			.refine((items) => new Set(items).size === items.length, {
				message: CART_MESSAGES.DUPLICATE_ADDON_ID,
			})
			.optional()
			.default([]),
		quantity: z
			.number()
			.int({ message: CART_MESSAGES.INVALID_QUANTITY })
			.min(CART_LIMITS.MIN_QUANTITY, {
				message: CART_MESSAGES.INVALID_QUANTITY,
			})
			.max(CART_LIMITS.MAX_QUANTITY, {
				message: CART_MESSAGES.INVALID_QUANTITY,
			}),
		specialInstructions: z
			.string()
			.max(CART_LIMITS.MAX_SPECIAL_INSTRUCTIONS_LENGTH, {
				message: CART_MESSAGES.INVALID_SPECIAL_INSTRUCTIONS,
			})
			.nullable()
			.optional(),
	})
	.strict();

export const addBatchCartItemsBodySchema = z
	.object({
		restaurantId: z
			.string()
			.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_RESTAURANT_ID }),
		items: z
			.array(batchCartItemSchema)
			.min(CART_LIMITS.MIN_BATCH_ITEMS, {
				message: CART_MESSAGES.INVALID_BATCH_ITEMS_MIN,
			})
			.max(CART_LIMITS.MAX_BATCH_ITEMS, {
				message: CART_MESSAGES.INVALID_BATCH_ITEMS_MAX,
			}),
	})
	.strict();

export type AddBatchCartItemsBody = z.infer<typeof addBatchCartItemsBodySchema>;
