import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface OrderProps {
	orderId: string;
	orderNumber: string;
	restaurantId: string;
	userId: string | null;
	orderStatus: OrderStatus | string;
	cancellationReason?: string | null | undefined;
	cancelledAt?: Date | null | undefined;
	createdAt?: Date | undefined;
}
