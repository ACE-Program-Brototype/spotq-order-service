import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { ORDER_HISTORY_PAGINATION } from "@common/constants/pagination.constants.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { z } from "zod";

export const orderHistoryQuerySchema = z.object({
	page: z.coerce
		.number({ message: ORDER_MESSAGES.INVALID_PAGE })
		.int({ message: ORDER_MESSAGES.INVALID_PAGE })
		.min(ORDER_HISTORY_PAGINATION.MIN_PAGE, {
			message: ORDER_MESSAGES.INVALID_PAGE,
		})
		.default(ORDER_HISTORY_PAGINATION.DEFAULT_PAGE),
	limit: z.coerce
		.number({ message: ORDER_MESSAGES.INVALID_LIMIT })
		.int({ message: ORDER_MESSAGES.INVALID_LIMIT })
		.min(ORDER_HISTORY_PAGINATION.MIN_LIMIT, {
			message: ORDER_MESSAGES.INVALID_LIMIT,
		})
		.max(ORDER_HISTORY_PAGINATION.MAX_LIMIT, {
			message: ORDER_MESSAGES.INVALID_LIMIT,
		})
		.default(ORDER_HISTORY_PAGINATION.DEFAULT_LIMIT),
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
});

export type OrderHistoryQuery = z.infer<typeof orderHistoryQuerySchema>;
