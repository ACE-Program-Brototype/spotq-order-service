import type {
	GetAdminOrdersInputDTO,
	GetAdminOrdersResponseDTO,
} from "@application/dtos/orders/get-admin-orders.dto.ts";
import { GetAdminOrdersMapper } from "@application/mappers/orders/get-admin-orders.mapper.ts";
import type { IGetAdminOrdersUseCase } from "@application/ports/use-cases/orders/get-admin-orders.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetAdminOrdersUseCase implements IGetAdminOrdersUseCase {
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	async execute(
		dto: GetAdminOrdersInputDTO,
	): Promise<GetAdminOrdersResponseDTO> {
		const ordersData = await this.orderRepository.getAdminOrders(dto);
		return GetAdminOrdersMapper.toResponseDTO(ordersData);
	}
}
