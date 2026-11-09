import type {
	GetRestaurantOrderAnalyticsInputDto,
	RestaurantOrderAnalyticsSummaryResponseDto,
} from "@application/dtos/internal/restaurant-order-analytics.dto.ts";

export interface IGetRestaurantOrderAnalyticsUseCase {
	execute(
		input: GetRestaurantOrderAnalyticsInputDto,
	): Promise<RestaurantOrderAnalyticsSummaryResponseDto>;
}
