import {
	ANALYTICS_INTERVALS,
	type AnalyticsInterval,
	DEFAULT_TIMEZONE,
} from "@shared/constants/analytics.constants.ts";

export type { AnalyticsInterval };

export interface ResolvedDateRange {
	startDate: Date;
	nextPeriodStart: Date;
	prevStartDate: Date;
	year: number;
	month: number;
	day: number;
	interval: AnalyticsInterval;
	timezone: string;
}

export interface DateRangeInput {
	interval?: AnalyticsInterval | undefined;
	day?: number | undefined;
	month?: number | undefined;
	year?: number | undefined;
	timezone?: string | undefined;
}

export function getZonedDate(
	year: number,
	month: number, // 1-12
	day: number,
	hour = 0,
	minute = 0,
	second = 0,
	timeZone: string = DEFAULT_TIMEZONE,
): Date {
	const utcGuess = new Date(
		Date.UTC(year, month - 1, day, hour, minute, second),
	);

	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
		hour12: false,
	});

	const parts = formatter.formatToParts(utcGuess);
	const partMap: Record<string, number> = {};
	for (const part of parts) {
		if (part.type !== "literal") {
			partMap[part.type] = Number.parseInt(part.value, 10);
		}
	}

	const zonedAsUtc = Date.UTC(
		partMap.year,
		partMap.month - 1,
		partMap.day,
		partMap.hour === 24 ? 0 : partMap.hour,
		partMap.minute,
		partMap.second,
	);

	const offsetMs = zonedAsUtc - utcGuess.getTime();
	return new Date(utcGuess.getTime() - offsetMs);
}

export function resolveAnalyticsDateRange(
	input: DateRangeInput,
): ResolvedDateRange {
	const timezone = input.timezone || DEFAULT_TIMEZONE;
	const interval: AnalyticsInterval = input.interval || ANALYTICS_INTERVALS.DAY;

	// Default to current date in the target timezone if not specified
	const now = new Date();
	const formatter = new Intl.DateTimeFormat("en-US", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
	const parts = formatter.formatToParts(now);
	const currentParts: Record<string, number> = {};
	for (const p of parts) {
		if (p.type !== "literal") {
			currentParts[p.type] = Number.parseInt(p.value, 10);
		}
	}

	const year = input.year ?? currentParts.year;
	const month = input.month ?? currentParts.month;
	const day = input.day ?? currentParts.day;

	let startDate: Date;
	let nextPeriodStart: Date;
	let prevStartDate: Date;

	switch (interval) {
		case ANALYTICS_INTERVALS.DAY: {
			startDate = getZonedDate(year, month, day, 0, 0, 0, timezone);
			nextPeriodStart = getZonedDate(year, month, day + 1, 0, 0, 0, timezone);
			prevStartDate = getZonedDate(year, month, day - 1, 0, 0, 0, timezone);
			break;
		}
		case ANALYTICS_INTERVALS.WEEK: {
			const targetDate = getZonedDate(year, month, day, 0, 0, 0, timezone);
			const weekday = new Intl.DateTimeFormat("en-US", {
				timeZone: timezone,
				weekday: "short",
			}).format(targetDate);

			const dayMap: Record<string, number> = {
				Mon: 0,
				Tue: -1,
				Wed: -2,
				Thu: -3,
				Fri: -4,
				Sat: -5,
				Sun: -6,
			};
			const mondayOffset = dayMap[weekday] ?? 0;

			startDate = getZonedDate(
				year,
				month,
				day + mondayOffset,
				0,
				0,
				0,
				timezone,
			);
			nextPeriodStart = getZonedDate(
				year,
				month,
				day + mondayOffset + 7,
				0,
				0,
				0,
				timezone,
			);
			prevStartDate = getZonedDate(
				year,
				month,
				day + mondayOffset - 7,
				0,
				0,
				0,
				timezone,
			);
			break;
		}
		case ANALYTICS_INTERVALS.MONTH: {
			startDate = getZonedDate(year, month, 1, 0, 0, 0, timezone);
			nextPeriodStart = getZonedDate(year, month + 1, 1, 0, 0, 0, timezone);
			prevStartDate = getZonedDate(year, month - 1, 1, 0, 0, 0, timezone);
			break;
		}
		case ANALYTICS_INTERVALS.YEAR: {
			startDate = getZonedDate(year, 1, 1, 0, 0, 0, timezone);
			nextPeriodStart = getZonedDate(year + 1, 1, 1, 0, 0, 0, timezone);
			prevStartDate = getZonedDate(year - 1, 1, 1, 0, 0, 0, timezone);
			break;
		}
	}

	return {
		startDate,
		nextPeriodStart,
		prevStartDate,
		year,
		month,
		day,
		interval,
		timezone,
	};
}
