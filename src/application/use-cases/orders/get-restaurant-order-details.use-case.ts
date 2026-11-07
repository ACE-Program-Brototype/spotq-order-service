import type {
	GetRestaurantOrderDetailsInputDTO,
	GetRestaurantOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-restaurant-order-details.dto";
import { GetRestaurantOrderDetailsMapper } from "@application/mappers/orders/get-restaurant-order-details.mapper";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IGetRestaurantOrdersDetailsUseCase } from "@application/ports/use-cases/orders/get-restaurant-order-details.use-case.port";
import TYPES from "@config/di/types";
import { OrderNotFoundError } from "@domain/errors";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface";
import { inject, injectable } from "inversify";

@injectable()
export class GetRestaurantOrderDetailsUseCase
	implements IGetRestaurantOrdersDetailsUseCase
{
	constructor(
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,

		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetRestaurantOrderDetailsInputDTO,
	): Promise<GetRestaurantOrderDetailsOutputDTO> {
		await this.restaurantServiceClient.validateRestaurant(dto.restaurantId);
		const order = await this.orderRepository.findByRestaurantAndOrderId(
			dto.restaurantId,
			dto.orderId,
		);

		if (!order) {
			throw new OrderNotFoundError();
		}
		return GetRestaurantOrderDetailsMapper.toDTO(order);
	}
}
