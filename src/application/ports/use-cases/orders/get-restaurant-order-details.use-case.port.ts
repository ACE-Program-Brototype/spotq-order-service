import type {
	GetRestaurantOrderDetailsInputDTO,
	GetRestaurantOrderDetailsResponseDTO,
} from "@application/dtos/orders/get-restaurant-order-details.dto";

export interface IGetRestaurantOrdersDetailsUseCase {
	execute(
		dto: GetRestaurantOrderDetailsInputDTO,
	): Promise<GetRestaurantOrderDetailsResponseDTO>;
}
