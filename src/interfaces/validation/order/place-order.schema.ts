import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { z } from "zod";

export const placeOrderBodySchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_RESTAURANT_ID }),
	cartId: z
		.string()
		.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ID })
		.optional(),
	paymentMode: z.enum(
		[PaymentMode.ONLINE, PaymentMode.PAY_AT_COUNTER] as const,
		{
			message: "Invalid payment mode. Supported modes: ONLINE, PAY_AT_COUNTER",
		},
	),
	specialInstructions: z
		.string()
		.max(250, { message: CART_MESSAGES.INVALID_SPECIAL_INSTRUCTIONS })
		.nullable()
		.optional(),
});

export type PlaceOrderBody = z.infer<typeof placeOrderBodySchema>;
