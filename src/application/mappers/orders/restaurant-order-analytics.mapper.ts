import type { RestaurantOrderAnalyticsSummaryResponseDTO } from "@application/dtos/internal/restaurant-order-analytics.dto.ts";
import type { ResolvedDateRange } from "@application/utils/date-range.util.ts";
import type { RestaurantOrderAnalyticsRepoResult } from "@domain/types/order-repository.types.ts";

export const RestaurantOrderAnalyticsMapper = {
	toResponseDTO(
		restaurantId: string,
		range: ResolvedDateRange,
		result: RestaurantOrderAnalyticsRepoResult,
	): RestaurantOrderAnalyticsSummaryResponseDTO {
		return {
			restaurantId,
			timezone: range.timezone,
			overview: result.overview,
			orderStatusBreakdown: result.orderStatusBreakdown,
			filters: {
				interval: range.interval,
				day: range.day,
				month: range.month,
				year: range.year,
				timezone: range.timezone,
			},
			generatedAt: new Date().toISOString(),
		};
	},
	toDTO(
		restaurantId: string,
		range: ResolvedDateRange,
		result: RestaurantOrderAnalyticsRepoResult,
	): RestaurantOrderAnalyticsSummaryResponseDTO {
		return this.toResponseDTO(restaurantId, range, result);
	},
};
