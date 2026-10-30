import type {
	GetOrdersOverviewInputDTO,
	OrdersOverviewResponseDTO,
} from "@application/dtos/orders/get-orders-overview.dto.ts";
import { OrdersOverviewMapper } from "@application/mappers/orders/orders-overview.mapper.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetOrdersOverviewUseCase implements IGetOrdersOverviewUseCase {
	constructor(
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetOrdersOverviewInputDTO,
	): Promise<OrdersOverviewResponseDTO> {
		await this.restaurantServiceClient.validateRestaurant(dto.restaurantId);

		const result = await this.orderRepository.getOrdersOverview({
			restaurantId: dto.restaurantId,
			fromDate: dto.from,
			toDate: dto.to,
			status: dto.status,
			search: dto.search,
			page: dto.page,
			limit: dto.limit,
		});

		return OrdersOverviewMapper.toDTO(result);
	}
}
