import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetOrdersOverviewInputDTO {
	restaurantId: string;
	from?: Date | undefined;
	to?: Date | undefined;
}

export interface OrderSummaryDTO {
	total_orders: number;
	gross_revenue: number;
	completed_orders: number;
	cancelled_orders: number;
}


export interface OrdersOverviewResponseDTO {
	summary: OrderSummaryDTO;
}
