import type {
	GetRestaurantProductAnalyticsInputDTO,
	RestaurantProductAnalyticsResponseDTO,
} from "@application/dtos/internal/restaurant-product-analytics.dto.ts";

export interface IGetRestaurantProductAnalyticsUseCase {
	execute(
		input: GetRestaurantProductAnalyticsInputDTO,
	): Promise<RestaurantProductAnalyticsResponseDTO>;
}
