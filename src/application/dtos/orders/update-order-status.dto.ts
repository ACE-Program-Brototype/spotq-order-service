import type { OrderResponseDTO } from "@application/dtos/orders/place-order.dto.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface UpdateOrderStatusInputDTO {
	orderId: string;
	status: OrderStatus;
	restaurantId: string;
	actorId: string;
	notes?: string | null;
}

export interface UpdateOrderStatusResponseDTO extends OrderResponseDTO {
	orderId: string;
	previousStatus: OrderStatus;
	status: OrderStatus;
	order: OrderResponseDTO;
}
