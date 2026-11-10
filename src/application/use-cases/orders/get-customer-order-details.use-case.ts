import type {
	GetCustomerOrderDetailsInputDTO,
	GetCustomerOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-customer-order-details.dto.ts";
import { CustomerOrderDetailsMapper } from "@application/mappers/orders/customer-order-details.mapper.ts";
import type { IGetCustomerOrderDetailsUseCase } from "@application/ports/use-cases/orders/get-customer-order-details.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderNotFoundError } from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetCustomerOrderDetailsUseCase
	implements IGetCustomerOrderDetailsUseCase
{
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: GetCustomerOrderDetailsInputDTO,
	): Promise<GetCustomerOrderDetailsOutputDTO> {
		const order = await this.orderRepository.findByCustomerAndOrderId(
			dto.customerId,
			dto.orderId,
		);

		if (!order) {
			throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
		}

		return CustomerOrderDetailsMapper.toResponseDTO(order);
	}
}
