import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { z } from "zod";

export const ordersOverviewQuerySchema = z.object({
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
});

export type OrdersOverviewQuery = z.infer<typeof ordersOverviewQuerySchema>;
