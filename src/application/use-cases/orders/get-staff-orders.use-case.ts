import type {
	GetStaffOrdersListInputDTO,
	GetStaffOrdersListResponseDTO,
} from "@application/dtos/orders/get-staff-orders.dto.ts";
import { StaffOrderListMapper } from "@application/mappers/orders/staff-order-list.mapper.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import type { IGetStaffOrdersListUseCase } from "@application/ports/use-cases/orders/get-staff-orders.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetStaffOrdersListUseCase implements IGetStaffOrdersListUseCase {
	constructor(
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetStaffOrdersListInputDTO,
	): Promise<GetStaffOrdersListResponseDTO> {
		await this.restaurantServiceClient.validateRestaurant(dto.restaurantId);

		const result = await this.orderRepository.getStaffOrders({
			restaurantId: dto.restaurantId,
			search: dto.search,
			status: dto.status,
			orderType: dto.orderType,
			sortOrder: dto.sortOrder,
			page: dto.page,
			limit: dto.limit,
		});

		return StaffOrderListMapper.toResponseDTO(result);
	}
}
