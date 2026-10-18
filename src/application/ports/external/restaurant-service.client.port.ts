import type { RestaurantValidationResultDto } from "@application/dtos/external/restaurant-validation.dto.ts";

export interface IRestaurantServiceClient {
	validateRestaurant(
		restaurantId: string,
	): Promise<RestaurantValidationResultDto>;
}
