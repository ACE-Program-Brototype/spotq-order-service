import type {
	OrdersOverviewResponseDTO,
	OrdersOverviewResponseDto,
} from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetOrdersOverviewRepoResult } from "@domain/types/order-repository.types";

export const OrdersOverviewMapper = {
	toDTO(repoResult: GetOrdersOverviewRepoResult): OrdersOverviewResponseDTO {
		return {
			summary: {
				total_orders: repoResult.summary.totalOrders,
				gross_revenue: Number(repoResult.summary.grossRevenue.toFixed(2)),
				completed_orders: repoResult.summary.completedOrders,
				cancelled_orders: repoResult.summary.cancelledOrders,
				pending_orders: repoResult.summary.pendingOrders,
				preparing_orders: repoResult.summary.preparingOrders,
				ready_orders: repoResult.summary.readyOrders,
			},
			orders: repoResult.orders.map((order) => ({
				order_id: order.orderId,
				order_number: order.orderNumber,
				status: order.orderStatus,
				customer_id: order.userId,
				total_amount: Number(order.grandTotal.toFixed(2)),
				items_count: order.itemsCount,
				created_at: order.createdAt.toISOString(),
			})),
			pagination: {
				current_page: repoResult.pagination.currentPage,
				total_pages: repoResult.pagination.totalPages,
				total_items: repoResult.pagination.totalItems,
			},
		};
	},

	toResponseDto(
		repoResult: GetOrdersOverviewRepoResult,
	): OrdersOverviewResponseDto {
		return this.toDTO(repoResult);
	},
};
