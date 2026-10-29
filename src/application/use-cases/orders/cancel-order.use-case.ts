import type {
	CancelOrderInputDto,
	CancelOrderResponseDto,
} from "@application/dtos/orders/cancel-order.dto.ts";
import { CancelOrderMapper } from "@application/mappers/cancel-order.mapper.ts";
import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderNotFoundError } from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/i-order.repository.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class CancelOrderUseCase implements ICancelOrderUseCase {
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: CancelOrderInputDto,
	): Promise<CancelOrderResponseDto> {
		const order = await this.orderRepository.findById(dto.orderId);

		if (!order) {
			throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
		}

		const previousStatus = order.orderStatus;

		order.cancel(dto.customerId, dto.cancellationReason);

		const cancelledOrder = await this.orderRepository.cancelOrder(
			order,
			previousStatus,
		);

		return CancelOrderMapper.toResponseDto(cancelledOrder);
	}
}

export default CancelOrderUseCase;
