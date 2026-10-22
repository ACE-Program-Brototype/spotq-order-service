import type { CancelOrderResponseDto } from "@application/dtos/orders/cancel-order.dto.ts";
import type { CancelledOrderData } from "@domain/types/order-repository.types";

export const CancelOrderMapper = {
	toResponseDto(order: CancelledOrderData): CancelOrderResponseDto {
		return {
			order_id: order.orderId,
			order_number: order.orderNumber,
			status: order.status,
			cancellation_reason: order.cancellationReason,
			cancelled_at: order.cancelledAt.toISOString(),
		};
	},
};

export default CancelOrderMapper;
