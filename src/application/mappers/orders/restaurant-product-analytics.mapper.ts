import type { RestaurantProductAnalyticsResponseDTO } from "@application/dtos/internal/restaurant-product-analytics.dto.ts";
import type { ResolvedDateRange } from "@application/utils/date-range.util.ts";
import type { RestaurantProductAnalyticsRepoResult } from "@domain/types/order-repository.types.ts";

export const RestaurantProductAnalyticsMapper = {
	toDTO(
		restaurantId: string,
		range: ResolvedDateRange,
		page: number,
		limit: number,
		result: RestaurantProductAnalyticsRepoResult,
	): RestaurantProductAnalyticsResponseDTO {
		return {
			restaurantId,
			timezone: range.timezone,
			totalProductsSold: result.totalProductsSold,
			topSelling: result.topSelling,
			slowMoving: result.slowMoving,
			filters: {
				interval: range.interval,
				day: range.day,
				month: range.month,
				year: range.year,
				page,
				limit,
			},
			generatedAt: new Date().toISOString(),
		};
	},
};
