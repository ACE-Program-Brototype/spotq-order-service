import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetOrdersOverviewInputDto {
	restaurantId: string;
	from?: Date | undefined;
	to?: Date | undefined;
	status?: OrderStatus | undefined;
	search?: string | undefined;
	page: number;
	limit: number;
}

export interface OrderSummaryDto {
	total_orders: number;
	gross_revenue: number;
	completed_orders: number;
	cancelled_orders: number;
	pending_orders: number;
	preparing_orders: number;
	ready_orders: number;
}

export interface OrderOverviewItemDto {
	order_id: string;
	order_number: string;
	status: string;
	customer_id: string | null;
	total_amount: number;
	items_count: number;
	created_at: string;
}

export interface OrderOverviewPaginationDto {
	current_page: number;
	total_pages: number;
	total_items: number;
}

export interface OrdersOverviewResponseDto {
	summary: OrderSummaryDto;
	orders: OrderOverviewItemDto[];
	pagination: OrderOverviewPaginationDto;
}
