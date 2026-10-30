import type { RestaurantValidationResultDTO } from "@application/dtos/external/restaurant-validation.dto.ts";

export interface IRestaurantServiceClient {
	validateRestaurant(
		restaurantId: string,
	): Promise<RestaurantValidationResultDTO>;
}
