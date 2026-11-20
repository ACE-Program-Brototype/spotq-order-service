import { CART_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const cartIdParamSchema = z
	.object({
		cartId: z
			.string()
			.regex(REGEX.UUID, { message: CART_MESSAGES.INVALID_CART_ID }),
	})
	.strict();

export type CartIdParam = z.infer<typeof cartIdParamSchema>;
