import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { z } from "zod";

const SUPPORTED_ORDER_STATUSES: readonly string[] = [
	OrderStatus.PLACED,
	OrderStatus.CONFIRMED,
	OrderStatus.PREPARING,
	OrderStatus.READY,
	OrderStatus.COMPLETED,
];

export const staffOrdersListQuerySchema = z.object({
	search: z.string().trim().optional(),

	status: z
		.string()
		.trim()
		.optional()
		.refine(
			(val) => {
				if (!val) return true;
				const tokens = val
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean);
				if (tokens.length === 0) return false;
				return tokens.every((token) =>
					SUPPORTED_ORDER_STATUSES.includes(token),
				);
			},
			{
				message: ORDER_MESSAGES.INVALID_STAFF_ORDER_STATUS,
			},
		)
		.transform((val) => {
			if (!val) return undefined;
			return val
				.split(",")
				.map((s) => s.trim() as OrderStatus)
				.filter(Boolean);
		}),

	orderType: z
		.enum([RestaurantPlan.QUEUE_PRO, RestaurantPlan.SELF_PRO] as const, {
			message: ORDER_MESSAGES.INVALID_ORDER_TYPE,
		})
		.optional(),

	sortOrder: z
		.enum(["asc", "desc"] as const, {
			message: ORDER_MESSAGES.INVALID_SORT_ORDER,
		})
		.default("asc"),

	page: z.coerce.number().int().positive().default(1),

	limit: z.coerce.number().int().positive().max(100).default(20),
});

export type StaffOrdersListQuery = z.infer<typeof staffOrdersListQuerySchema>;
