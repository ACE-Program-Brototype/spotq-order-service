import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

export const restaurantIdParamSchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_RESTAURANT_ID }),
});

export type RestaurantIdParam = z.infer<typeof restaurantIdParamSchema>;

export default restaurantIdParamSchema;
