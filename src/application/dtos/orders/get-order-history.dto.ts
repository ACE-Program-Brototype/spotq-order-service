import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetOrderHistoryInputDTO {
	customerId: string;
	page: number;
	limit: number;
	status?: OrderStatus | undefined;
}

export interface OrderHistoryItemDTO {
	order_id: string;
	order_number: string;
	restaurant_id: string;
	status: string;
	items_count: number;
	total_amount: number;
	created_at: string;
}

export interface OrderHistoryPaginationDTO {
	current_page: number;
	total_pages: number;
	total_orders: number;
	has_next: boolean;
}

export interface OrderHistoryResponseDTO {
	orders: OrderHistoryItemDTO[];
	pagination: OrderHistoryPaginationDTO;
}
