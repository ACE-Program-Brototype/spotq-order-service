import type {
	GetOrderHistoryInputDTO,
	OrderHistoryResponseDTO,
} from "@application/dtos/orders/get-order-history.dto.ts";
import { OrderHistoryMapper } from "@application/mappers/order-history.mapper.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/i-order.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetOrderHistoryUseCase implements IGetOrderHistoryUseCase {
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetOrderHistoryInputDTO,
	): Promise<OrderHistoryResponseDTO> {
		const repoResult = await this.orderRepository.getCustomerOrderHistory({
			customerId: dto.customerId,
			page: dto.page,
			limit: dto.limit,
			status: dto.status,
		});

		return OrderHistoryMapper.toDTO(repoResult);
	}
}

export default GetOrderHistoryUseCase;
