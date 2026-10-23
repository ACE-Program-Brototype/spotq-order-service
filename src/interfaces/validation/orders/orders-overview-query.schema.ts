import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
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

	status: z
		.enum(
			[
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.SERVED,
				OrderStatus.COMPLETED,
				OrderStatus.CANCELLED,
			] as const,
			{
				message: ORDER_MESSAGES.INVALID_ORDER_STATUS,
			},
		)
		.optional(),

	search: z.string().trim().max(100).optional(),
	page: z.coerce.number().int().positive().default(1),
	limit: z.coerce.number().int().positive().max(100).default(20),
});

export type OrdersOverviewQuery = z.infer<typeof ordersOverviewQuerySchema>;
