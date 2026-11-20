import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetRestaurantOrdersListInputDTO {
	restaurantId: string;
	search?: string | undefined;
	status?: OrderStatus | undefined;
	from?: Date | undefined;
	to?: Date | undefined;
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
export interface RestaurantOrdersPaginationDTO {
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
}

export interface GetRestaurantOrdersListResponseDTO {
	orders: RestaurantOrderListItemDTO[];
	pagination: RestaurantOrdersPaginationDTO;
}
