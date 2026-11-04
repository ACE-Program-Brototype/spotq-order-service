import type { UpdateOrderStatusResponseDTO } from "@application/dtos/orders/update-order-status.dto.ts";
import { OrderResponseMapper } from "@application/mappers/orders/order-response.mapper.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export const UpdateOrderStatusMapper = {
	toResponseDTO(
		order: Order,
		previousStatus: OrderStatus,
	): UpdateOrderStatusResponseDTO {
		const orderDetails = OrderResponseMapper.toDTO(order);

		return {
			...orderDetails,
			orderId: order.id,
			previousStatus,
			status: order.orderStatus,
			order: orderDetails,
		};
	},
};
