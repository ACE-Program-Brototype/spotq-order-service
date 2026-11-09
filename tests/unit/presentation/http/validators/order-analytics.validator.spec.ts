import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	orderAnalyticsSummaryQuerySchema,
	orderProductAnalyticsQuerySchema,
} from "@presentation/http/validators/internal/order-analytics.validator.ts";
import { DEFAULT_TIMEZONE } from "@shared/constants/analytics.constants.ts";

describe("Order Analytics Validators", () => {
	describe("orderAnalyticsSummaryQuerySchema", () => {
		it("should validate and apply defaults for empty query", () => {
			const parsed = orderAnalyticsSummaryQuerySchema.parse({});
			assert.strictEqual(parsed.interval, "DAY");
			assert.strictEqual(parsed.status, "COMPLETED");
			assert.strictEqual(parsed.timezone, DEFAULT_TIMEZONE);
		});

		it("should coerce valid numeric strings for day, month, year", () => {
			const parsed = orderAnalyticsSummaryQuerySchema.parse({
				interval: "MONTH",
				day: "15",
				month: "11",
				year: "2026",
				status: "ALL",
				timezone: "UTC",
			});
			assert.strictEqual(parsed.interval, "MONTH");
			assert.strictEqual(parsed.day, 15);
			assert.strictEqual(parsed.month, 11);
			assert.strictEqual(parsed.year, 2026);
			assert.strictEqual(parsed.status, "ALL");
			assert.strictEqual(parsed.timezone, "UTC");
		});

		it("should reject invalid interval", () => {
			assert.throws(() => {
				orderAnalyticsSummaryQuerySchema.parse({ interval: "HOURLY" });
			});
		});

		it("should reject invalid month (> 12)", () => {
			assert.throws(() => {
				orderAnalyticsSummaryQuerySchema.parse({ month: "13" });
			});
		});

		it("should reject invalid timezone string", () => {
			assert.throws(() => {
				orderAnalyticsSummaryQuerySchema.parse({
					timezone: "Invalid/Not_A_Timezone",
				});
			});
		});
	});

	describe("orderProductAnalyticsQuerySchema", () => {
		it("should validate and apply defaults for pagination and interval", () => {
			const parsed = orderProductAnalyticsQuerySchema.parse({});
			assert.strictEqual(parsed.interval, "DAY");
			assert.strictEqual(parsed.page, 1);
			assert.strictEqual(parsed.limit, 10);
			assert.strictEqual(parsed.timezone, DEFAULT_TIMEZONE);
		});

		it("should coerce page and limit", () => {
			const parsed = orderProductAnalyticsQuerySchema.parse({
				page: "2",
				limit: "25",
			});
			assert.strictEqual(parsed.page, 2);
			assert.strictEqual(parsed.limit, 25);
		});

		it("should reject limit exceeding 50", () => {
			assert.throws(() => {
				orderProductAnalyticsQuerySchema.parse({ limit: "51" });
			});
		});

		it("should reject non-positive page", () => {
			assert.throws(() => {
				orderProductAnalyticsQuerySchema.parse({ page: "0" });
			});
		});
	});
});
