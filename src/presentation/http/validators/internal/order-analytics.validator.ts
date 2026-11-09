import {
	ANALYTICS_INTERVALS,
	ANALYTICS_PAGINATION,
	DEFAULT_TIMEZONE,
} from "@shared/constants/analytics.constants.ts";
import { z } from "zod";

function isValidTimezone(tz: string): boolean {
	try {
		Intl.DateTimeFormat(undefined, { timeZone: tz });
		return true;
	} catch {
		return false;
	}
}

export const orderAnalyticsSummaryQuerySchema = z
	.object({
		interval: z
			.enum([
				ANALYTICS_INTERVALS.DAY,
				ANALYTICS_INTERVALS.WEEK,
				ANALYTICS_INTERVALS.MONTH,
				ANALYTICS_INTERVALS.YEAR,
			])
			.optional()
			.default(ANALYTICS_INTERVALS.DAY),
		day: z.coerce.number().int().min(1).max(31).optional(),
		month: z.coerce.number().int().min(1).max(12).optional(),
		year: z.coerce.number().int().min(2000).max(2100).optional(),
		status: z.enum(["COMPLETED", "ALL"]).optional().default("COMPLETED"),
		timezone: z
			.string()
			.refine(isValidTimezone, { message: "Invalid IANA timezone string" })
			.optional()
			.default(DEFAULT_TIMEZONE),
	})
	.strict();

export type OrderAnalyticsSummaryQuery = z.infer<
	typeof orderAnalyticsSummaryQuerySchema
>;

export const orderProductAnalyticsQuerySchema = z
	.object({
		interval: z
			.enum([
				ANALYTICS_INTERVALS.DAY,
				ANALYTICS_INTERVALS.WEEK,
				ANALYTICS_INTERVALS.MONTH,
				ANALYTICS_INTERVALS.YEAR,
			])
			.optional()
			.default(ANALYTICS_INTERVALS.DAY),
		day: z.coerce.number().int().min(1).max(31).optional(),
		month: z.coerce.number().int().min(1).max(12).optional(),
		year: z.coerce.number().int().min(2000).max(2100).optional(),
		timezone: z
			.string()
			.refine(isValidTimezone, { message: "Invalid IANA timezone string" })
			.optional()
			.default(DEFAULT_TIMEZONE),
		page: z.coerce
			.number()
			.int()
			.min(1)
			.optional()
			.default(ANALYTICS_PAGINATION.DEFAULT_PAGE),
		limit: z.coerce
			.number()
			.int()
			.min(1)
			.max(ANALYTICS_PAGINATION.MAX_LIMIT)
			.optional()
			.default(ANALYTICS_PAGINATION.DEFAULT_LIMIT),
	})
	.strict();

export type OrderProductAnalyticsQuery = z.infer<
	typeof orderProductAnalyticsQuerySchema
>;
