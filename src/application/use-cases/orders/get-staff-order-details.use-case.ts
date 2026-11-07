import type {
	GetStaffOrderDetailsInputDTO,
	StaffOrderDetailsResponseDTO,
} from "@application/dtos/orders/get-staff-order-details.dto.ts";
import { StaffOrderDetailsMapper } from "@application/mappers/orders/staff-order-details.mapper.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import type { IGetStaffOrderDetailsUseCase } from "@application/ports/use-cases/orders/get-staff-order-details.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderNotFoundError } from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetStaffOrderDetailsUseCase
	implements IGetStaffOrderDetailsUseCase
{
	constructor(
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetStaffOrderDetailsInputDTO,
	): Promise<StaffOrderDetailsResponseDTO> {
		await this.restaurantServiceClient.validateRestaurant(dto.restaurantId);

		const order = await this.orderRepository.findByRestaurantAndOrderId(
			dto.restaurantId,
			dto.orderId,
		);

		if (!order) {
			throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
		}

		order.validateRestaurantAccess(dto.restaurantId);

		return StaffOrderDetailsMapper.toDTO(order);
	}
}
