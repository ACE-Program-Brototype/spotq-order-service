import type { GetAdminOrdersResponseDTO } from "@application/dtos/orders/get-admin-orders.dto.ts";
import type { GetAdminOrdersRepoResult } from "@domain/types/order-repository.types.ts";

export const GetAdminOrdersMapper = {
	toDTO(repoResult: GetAdminOrdersRepoResult): GetAdminOrdersResponseDTO {
		return {
			orders: repoResult.orders.map((order) => ({
				orderId: order.orderId,
				orderNumber: order.orderNumber,
				restaurantId: order.restaurantId,
				restaurantName: order.restaurantName,
				customerId: order.customerId,
				status: order.status,
				paymentStatus:
					order.paymentStatus as GetAdminOrdersResponseDTO["orders"][number]["paymentStatus"],
				totalAmount: order.totalAmount,
				platformFeeAssessed: order.platformFeeAssessed,
				platformFeeCollected: null,
				createdAt: order.createdAt.toISOString(),
				updatedAt: order.updatedAt.toISOString(),
			})),
			pagination: {
				currentPage: repoResult.currentPage,
				limit: repoResult.limit,
				totalPages: repoResult.totalPages,
				totalOrders: repoResult.totalOrders,
				hasNextPage: repoResult.hasNextPage,
				hasPreviousPage: repoResult.hasPreviousPage,
			},
			metrics: {
				totalOrders: repoResult.metricsTotalOrders,
				ordersByStatus: repoResult.ordersByStatus,
				totalOrderValue: repoResult.totalOrderValue,
				platformFeesCollected: null,
			},
		};
	},
};
