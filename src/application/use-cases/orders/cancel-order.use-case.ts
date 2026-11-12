import type {
	CancelOrderInputDTO,
	CancelOrderResponseDTO,
} from "@application/dtos/orders/cancel-order.dto.ts";
import { CancelOrderMapper } from "@application/mappers/orders/cancel-order.mapper.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { ORDER_DEFAULTS } from "@domain/constants/order.constants.ts";
import { OrderNotFoundError } from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class CancelOrderUseCase implements ICancelOrderUseCase {
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
		@inject(TYPES.PaymentServiceClient)
		private readonly paymentServiceClient: IPaymentServiceClient,
	) {}

	public async execute(
		dto: CancelOrderInputDTO,
	): Promise<CancelOrderResponseDTO> {
		const order = await this.orderRepository.findById(dto.orderId);

		if (!order) {
			throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
		}

		const previousStatus = order.orderStatus;

		order.cancel(dto.customerId, dto.cancellationReason);

		let auditNote: string | undefined;

		if (order.isPaid()) {
			const idempotencyKey = order.id;

			const refundResult = await this.paymentServiceClient.processRefund({
				orderId: order.id,
				amountPaise: order.calculateGrandTotalInPaise(),
				reason:
					dto.cancellationReason ?? ORDER_DEFAULTS.DEFAULT_CANCELLATION_REASON,
				notes: ORDER_DEFAULTS.REFUND_NOTES_TEMPLATE(order.orderNumber),
				idempotencyKey,
			});

			order.markAsRefunded();
			auditNote = ORDER_DEFAULTS.REFUND_AUDIT_NOTE_TEMPLATE(
				refundResult.refundId,
			);
		}

		const cancelledOrder = await this.orderRepository.cancelOrder(
			order,
			previousStatus,
			auditNote,
		);

		return CancelOrderMapper.toDTO(cancelledOrder);
	}
}
