import type { GetRestaurantOrdersListResponseDTO } from "@application/dtos/orders/get-restaurant-orders.dto";
import type { GetRestaurantOrdersRepoResult } from "@domain/types/order-repository.types";

export const GetRestaurantOrdersListMapper = {
	toDTO(
		repoResult: GetRestaurantOrdersRepoResult,
	): GetRestaurantOrdersListResponseDTO {
		return {
			orders: repoResult.orders.map((order) => ({
				orderId: order.orderId,
				orderNumber: order.orderNumber,
				orderStatus: order.orderStatus,
				itemsCount: order.itemsCount,
				grandTotal: Number(order.grandTotal.toFixed(2)),
				createdAt: order.createdAt,
			})),
			pagination: {
				totalOrders: repoResult.totalOrders,
				totalPages: repoResult.totalPages,
				currentPage: repoResult.currentPage,
				hasNext: repoResult.hasNext,
			},
		};
	},
};
