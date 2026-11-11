export const DEFAULT_TIMEZONE = "Asia/Kolkata";

export const ANALYTICS_INTERVALS = {
	DAY: "DAY",
	WEEK: "WEEK",
	MONTH: "MONTH",
	YEAR: "YEAR",
} as const;

export type AnalyticsInterval =
	(typeof ANALYTICS_INTERVALS)[keyof typeof ANALYTICS_INTERVALS];

export const PRODUCT_CLASSIFICATIONS = {
	LOW_VOLUME: "LOW_VOLUME",
	NORMAL: "NORMAL",
} as const;

export type ProductClassification =
	(typeof PRODUCT_CLASSIFICATIONS)[keyof typeof PRODUCT_CLASSIFICATIONS];

export const ANALYTICS_PAGINATION = {
	DEFAULT_PAGE: 1,
	DEFAULT_LIMIT: 10,
	MAX_LIMIT: 50,
} as const;

export const ANALYTICS_CONSTANTS = {
	DEFAULT_TIMEZONE,
	DEFAULT_INTERVAL: ANALYTICS_INTERVALS.DAY,
	LOW_VOLUME_THRESHOLD: 3,
} as const;
