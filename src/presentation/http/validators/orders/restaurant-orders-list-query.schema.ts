import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants";
import { z } from "zod";

export const restaurantOrderListQuerySchema = z.object({
	search: z.string().trim().optional(),

	status: z.nativeEnum(OrderStatus).optional(),

	from: z
		.string()
		.trim()
		.refine((val) => !Number.isNaN(Date.parse(val)), {
			message: ORDER_MESSAGES.INVALID_FROM_DATE,
		})
		.transform((val) => {
			const date = new Date(val);
			if (val.length <= 10) {
				date.setUTCHours(0, 0, 0, 0);
			}
			return date;
		})
		.optional(),

	to: z
		.string()
		.trim()
		.refine((val) => !Number.isNaN(Date.parse(val)), {
			message: ORDER_MESSAGES.INVALID_TO_DATE,
		})
		.transform((val) => {
			const date = new Date(val);
			if (val.length <= 10) {
				date.setUTCHours(23, 59, 59, 999);
			}
			return date;
		})
		.optional(),

	page: z.coerce.number().int().positive().default(1),

	limit: z.coerce.number().int().positive().max(100).default(10),
});

export type RestaurantOrderListQuery = z.infer<
	typeof restaurantOrderListQuerySchema
>;
