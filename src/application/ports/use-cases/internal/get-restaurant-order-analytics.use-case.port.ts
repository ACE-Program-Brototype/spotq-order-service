import type {
	GetRestaurantOrderAnalyticsInputDTO,
	RestaurantOrderAnalyticsSummaryResponseDTO,
} from "@application/dtos/internal/restaurant-order-analytics.dto.ts";

export interface IGetRestaurantOrderAnalyticsUseCase {
	execute(
		input: GetRestaurantOrderAnalyticsInputDTO,
	): Promise<RestaurantOrderAnalyticsSummaryResponseDTO>;
}
