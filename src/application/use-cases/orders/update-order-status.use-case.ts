import type {
	UpdateOrderStatusInputDTO,
	UpdateOrderStatusResponseDTO,
} from "@application/dtos/orders/update-order-status.dto.ts";
import { UpdateOrderStatusMapper } from "@application/mappers/orders/update-order-status.mapper.ts";
import type { IUpdateOrderStatusUseCase } from "@application/ports/use-cases/orders/update-order-status.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { ORDER_DEFAULTS } from "@domain/constants/order.constants.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderNotFoundError } from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class UpdateOrderStatusUseCase implements IUpdateOrderStatusUseCase {
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		dto: UpdateOrderStatusInputDTO,
	): Promise<UpdateOrderStatusResponseDTO> {
		const order = await this.orderRepository.findById(dto.orderId);

		if (!order) {
			throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
		}

		const previousStatus = order.orderStatus;

		order.updateStatus(dto.status, dto.restaurantId);

		const auditNote =
			dto.notes ||
			(dto.status === OrderStatus.COMPLETED
				? ORDER_DEFAULTS.COMPLETED_AUDIT_NOTE
				: ORDER_DEFAULTS.STATUS_UPDATED_AUDIT_NOTE(previousStatus, dto.status));

		const updatedOrder = await this.orderRepository.updateOrderStatus(
			order,
			previousStatus,
			dto.actorId,
			auditNote,
		);

		return UpdateOrderStatusMapper.toResponseDTO(updatedOrder, previousStatus);
	}
}
