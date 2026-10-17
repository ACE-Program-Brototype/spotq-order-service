import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { REGEX } from "@common/constants/regex.constants.ts";
import { z } from "zod";

export const restaurantIdParamSchema = z.object({
	restaurantId: z
		.string()
		.regex(REGEX.UUID, { message: ORDER_MESSAGES.INVALID_RESTAURANT_ID }),
});

export type RestaurantIdParam = z.infer<typeof restaurantIdParamSchema>;

export default restaurantIdParamSchema;
