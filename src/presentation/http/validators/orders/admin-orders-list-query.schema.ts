import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { REGEX } from "@shared/constants/regex.constants.ts";
import { z } from "zod";

const dateQuerySchema = (inclusiveDateOnly = false) =>
	z
		.string()
		.trim()
		.refine((value) => {
			if (REGEX.DATE_ONLY.test(value)) {
				const parsed = new Date(`${value}T00:00:00.000Z`);
				return (
					!Number.isNaN(parsed.getTime()) &&
					parsed.toISOString().startsWith(value)
				);
			}
			return (
				REGEX.ISO_DATE_TIME.test(value) && !Number.isNaN(Date.parse(value))
			);
		}, "Date must be YYYY-MM-DD or a valid ISO date-time")
		.transform((value) => {
			const date = new Date(value);
			if (REGEX.DATE_ONLY.test(value)) {
				date.setUTCHours(0, 0, 0, 0);
				if (inclusiveDateOnly) {
					date.setUTCDate(date.getUTCDate() + 1);
				}
			}
			return date;
		});

const optionalAmountSchema = z.preprocess(
	(value) => (value === "" ? Number.NaN : value),
	z.coerce.number().finite().min(0).optional(),
);

export const adminOrdersListQuerySchema = z
	.object({
		search: z.string().trim().min(1).optional(),
		status: z
			.string()
			.trim()
			.optional()
			.transform((value) =>
				value
					?.split(",")
					.map((status) => status.trim())
					.filter(Boolean),
			)
			.pipe(z.array(z.nativeEnum(OrderStatus)).min(1).optional()),
		restaurantId: z.string().trim().min(1).optional(),
		customerId: z.string().trim().min(1).optional(),
		paymentStatus: z.nativeEnum(PaymentStatus).optional(),
		startDate: dateQuerySchema().optional(),
		endDate: dateQuerySchema(true).optional(),
		minAmount: optionalAmountSchema,
		maxAmount: optionalAmountSchema,
		sortBy: z
			.enum(["createdAt", "updatedAt", "totalAmount", "status"])
			.default("createdAt"),
		sortOrder: z.enum(["asc", "desc"]).default("desc"),
		page: z.coerce.number().int().min(1).default(1),
		limit: z.coerce.number().int().min(1).max(100).default(25),
	})
	.strict()
	.superRefine((query, ctx) => {
		if (query.startDate && query.endDate && query.startDate >= query.endDate) {
			ctx.addIssue({
				code: "custom",
				path: ["endDate"],
				message: "endDate must be later than startDate",
			});
		}
		if (
			query.minAmount !== undefined &&
			query.maxAmount !== undefined &&
			query.minAmount > query.maxAmount
		) {
			ctx.addIssue({
				code: "custom",
				path: ["maxAmount"],
				message: "maxAmount must be greater than or equal to minAmount",
			});
		}
	});

export type AdminOrdersListQuery = z.infer<typeof adminOrdersListQuerySchema>;
