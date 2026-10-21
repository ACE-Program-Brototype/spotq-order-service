import { ORDER_LIMITS } from "@common/constants/limits.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { z } from "zod";

export const placeOrderBodySchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_RESTAURANT_ID }),
	cartId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_CART_ID })
		.optional(),
	paymentMode: z.enum(
		[PaymentMode.ONLINE, PaymentMode.PAY_AT_COUNTER] as const,
		{
			message: ORDER_MESSAGES.INVALID_PAYMENT_MODE_SELECTION,
		},
	),
	userName: z
		.string()
		.trim()
		.max(ORDER_LIMITS.MAX_USER_NAME_LENGTH, {
			message: ORDER_MESSAGES.INVALID_USER_NAME,
		})
		.nullable()
		.optional(),
	userPhone: z
		.string()
		.trim()
		.regex(REGEX.PHONE, { message: ORDER_MESSAGES.INVALID_USER_PHONE })
		.max(ORDER_LIMITS.MAX_USER_PHONE_LENGTH, {
			message: ORDER_MESSAGES.INVALID_USER_PHONE,
		})
		.nullable()
		.optional(),
	specialInstructions: z
		.string()
		.max(ORDER_LIMITS.MAX_SPECIAL_INSTRUCTIONS_LENGTH, {
			message: ORDER_MESSAGES.INVALID_SPECIAL_INSTRUCTIONS,
		})
		.nullable()
		.optional(),
});

export type PlaceOrderBody = z.infer<typeof placeOrderBodySchema>;
