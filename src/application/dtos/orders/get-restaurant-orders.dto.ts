import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetRestaurantOrdersListInputDTO {
	restaurantId: string;
	search?: string;
	status?: OrderStatus;
	from?: Date;
	to?: Date;
	page: number;
	limit: number;
}

export interface RestaurantOrderListItemDTO {
	orderId: string;
	orderNumber: string;
	orderStatus: string;
	itemsCount: number;
	grandTotal: number;
	createdAt: Date;
}
export interface GetRestaurantOrdersListResponseDTO {
	orders: RestaurantOrderListItemDTO[];
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
}
