import type {
	GetRestaurantProductAnalyticsInputDto,
	RestaurantProductAnalyticsResponseDto,
} from "@application/dtos/internal/restaurant-product-analytics.dto.ts";

export interface IGetRestaurantProductAnalyticsUseCase {
	execute(
		input: GetRestaurantProductAnalyticsInputDto,
	): Promise<RestaurantProductAnalyticsResponseDto>;
}
