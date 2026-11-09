import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	getZonedDate,
	resolveAnalyticsDateRange,
} from "@application/utils/date-range.util.ts";
import { DEFAULT_TIMEZONE } from "@shared/constants/analytics.constants.ts";

describe("Analytics Date Range Util", () => {
	describe("getZonedDate", () => {
		it("should resolve exact UTC timestamp for default timezone midnight", () => {
			const date = getZonedDate(2026, 11, 9, 0, 0, 0, DEFAULT_TIMEZONE);
			// Asia/Kolkata is UTC+5:30 -> midnight 9 Nov is 18:30 on 8 Nov UTC
			assert.strictEqual(date.toISOString(), "2026-11-08T18:30:00.000Z");
		});

		it("should resolve exact UTC timestamp for America/New_York midnight", () => {
			const date = getZonedDate(2026, 11, 9, 0, 0, 0, "America/New_York");
			// America/New_York (EST) is UTC-5 -> midnight 9 Nov is 05:00 on 9 Nov UTC
			assert.strictEqual(date.toISOString(), "2026-11-09T05:00:00.000Z");
		});
	});

	describe("resolveAnalyticsDateRange", () => {
		it("should compute DAY half-open range and previous period", () => {
			const range = resolveAnalyticsDateRange({
				interval: "DAY",
				year: 2026,
				month: 11,
				day: 9,
				timezone: DEFAULT_TIMEZONE,
			});

			assert.strictEqual(range.interval, "DAY");
			assert.strictEqual(range.year, 2026);
			assert.strictEqual(range.month, 11);
			assert.strictEqual(range.day, 9);
			assert.strictEqual(
				range.startDate.toISOString(),
				"2026-11-08T18:30:00.000Z",
			);
			assert.strictEqual(
				range.nextPeriodStart.toISOString(),
				"2026-11-09T18:30:00.000Z",
			);
			assert.strictEqual(
				range.prevStartDate.toISOString(),
				"2026-11-07T18:30:00.000Z",
			);
		});

		it("should compute MONTH half-open range and previous period across month boundaries", () => {
			const range = resolveAnalyticsDateRange({
				interval: "MONTH",
				year: 2026,
				month: 11,
				timezone: DEFAULT_TIMEZONE,
			});

			assert.strictEqual(range.interval, "MONTH");
			// 1 Nov 00:00 IST -> 31 Oct 18:30 UTC
			assert.strictEqual(
				range.startDate.toISOString(),
				"2026-10-31T18:30:00.000Z",
			);
			// 1 Dec 00:00 IST -> 30 Nov 18:30 UTC
			assert.strictEqual(
				range.nextPeriodStart.toISOString(),
				"2026-11-30T18:30:00.000Z",
			);
			// 1 Oct 00:00 IST -> 30 Sep 18:30 UTC
			assert.strictEqual(
				range.prevStartDate.toISOString(),
				"2026-09-30T18:30:00.000Z",
			);
		});

		it("should compute YEAR half-open range and previous period", () => {
			const range = resolveAnalyticsDateRange({
				interval: "YEAR",
				year: 2026,
				timezone: DEFAULT_TIMEZONE,
			});

			assert.strictEqual(range.interval, "YEAR");
			// 1 Jan 2026 00:00 IST -> 31 Dec 2025 18:30 UTC
			assert.strictEqual(
				range.startDate.toISOString(),
				"2025-12-31T18:30:00.000Z",
			);
			// 1 Jan 2027 00:00 IST -> 31 Dec 2026 18:30 UTC
			assert.strictEqual(
				range.nextPeriodStart.toISOString(),
				"2026-12-31T18:30:00.000Z",
			);
			// 1 Jan 2025 00:00 IST -> 31 Dec 2024 18:30 UTC
			assert.strictEqual(
				range.prevStartDate.toISOString(),
				"2024-12-31T18:30:00.000Z",
			);
		});

		it("should compute WEEK half-open range aligned to Monday", () => {
			const range = resolveAnalyticsDateRange({
				interval: "WEEK",
				year: 2026,
				month: 11,
				day: 9, // 9 Nov 2026 is a Monday
				timezone: DEFAULT_TIMEZONE,
			});

			assert.strictEqual(range.interval, "WEEK");
			// Monday 9 Nov 00:00 IST -> Sunday 8 Nov 18:30 UTC
			assert.strictEqual(
				range.startDate.toISOString(),
				"2026-11-08T18:30:00.000Z",
			);
			// Next Monday 16 Nov 00:00 IST -> Sunday 15 Nov 18:30 UTC
			assert.strictEqual(
				range.nextPeriodStart.toISOString(),
				"2026-11-15T18:30:00.000Z",
			);
		});
	});
});
