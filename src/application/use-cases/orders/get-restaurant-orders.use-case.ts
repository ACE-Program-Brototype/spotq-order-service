import type {
	GetRestaurantOrdersListInputDTO,
	GetRestaurantOrdersListResponseDTO,
} from "@application/dtos/orders/get-restaurant-orders.dto";
import { GetRestaurantOrdersListMapper } from "@application/mappers/orders/get-restaurant-orders.mapper";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IGetRestaurantOrdersListUseCase } from "@application/ports/use-cases/orders/get-restaurant-orders.use-case.port";
import { TYPES } from "@config/di/types";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface";
import { inject, injectable } from "inversify";

@injectable()
export class GetRestaurantOrdersListUseCase
	implements IGetRestaurantOrdersListUseCase
{
	constructor(
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,

		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetRestaurantOrdersListInputDTO,
	): Promise<GetRestaurantOrdersListResponseDTO> {
		await this.restaurantServiceClient.validateRestaurant(dto.restaurantId);

		const result = await this.orderRepository.getRestaurantOrders({
			restaurantId: dto.restaurantId,
			search: dto.search,
			status: dto.status,
			fromDate: dto.from,
			toDate: dto.to,
			page: dto.page,
			limit: dto.limit,
		});

		return GetRestaurantOrdersListMapper.toDTO(result);
	}
}
