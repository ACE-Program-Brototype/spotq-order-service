import type { CancelOrderResponseDTO } from "@application/dtos/orders/cancel-order.dto.ts";
import type { CancelledOrderData } from "@domain/types/order-repository.types.ts";

export const CancelOrderMapper = {
	toDTO(order: CancelledOrderData): CancelOrderResponseDTO {
		return {
			order_id: order.orderId,
			order_number: order.orderNumber,
			status: order.status,
			cancellation_reason: order.cancellationReason,
			cancelled_at: (order.cancelledAt ?? new Date()).toISOString(),
		};
	},

	toResponseDto(order: CancelledOrderData): CancelOrderResponseDTO {
		return CancelOrderMapper.toDTO(order);
	},
};

export default CancelOrderMapper;
