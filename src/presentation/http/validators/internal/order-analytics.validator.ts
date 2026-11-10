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

function isValidCalendarDate(
	year?: number | undefined,
	month?: number | undefined,
	day?: number | undefined,
): boolean {
	if (day === undefined) {
		return true;
	}
	const targetMonth = month ?? new Date().getUTCMonth() + 1;
	const targetYear = year ?? new Date().getUTCFullYear();
	const date = new Date(Date.UTC(targetYear, targetMonth - 1, day));
	return (
		date.getUTCFullYear() === targetYear &&
		date.getUTCMonth() === targetMonth - 1 &&
		date.getUTCDate() === day
	);
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
		timezone: z
			.string()
			.refine(isValidTimezone, { message: "Invalid IANA timezone string" })
			.optional()
			.default(DEFAULT_TIMEZONE),
	})
	.strict()
	.superRefine((data, ctx) => {
		if (!isValidCalendarDate(data.year, data.month, data.day)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid calendar date for the specified month and year",
				path: ["day"],
			});
		}
	});

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
	.strict()
	.superRefine((data, ctx) => {
		if (!isValidCalendarDate(data.year, data.month, data.day)) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message: "Invalid calendar date for the specified month and year",
				path: ["day"],
			});
		}
	});

export type OrderProductAnalyticsQuery = z.infer<
	typeof orderProductAnalyticsQuerySchema
>;
