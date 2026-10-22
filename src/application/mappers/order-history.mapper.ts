import type {
	OrderHistoryItemDto,
	OrderHistoryResponseDto,
} from "@application/dtos/orders/get-order-history.dto.ts";
import type { GetCustomerOrderHistoryRepoResult } from "@domain/types/order-repository.types";

export const OrderHistoryMapper = {
	toResponseDto(
		repoResult: GetCustomerOrderHistoryRepoResult,
	): OrderHistoryResponseDto {
		const orders: OrderHistoryItemDto[] = repoResult.orders.map((order) => ({
			order_id: order.orderId,
			order_number: order.orderNumber,
			restaurant_id: order.restaurantId,
			status: order.orderStatus,
			items_count: order.itemsCount,
			total_amount: Number(order.grandTotal.toFixed(2)),
			created_at: order.createdAt.toISOString(),
		}));

		return {
			orders,
			pagination: {
				current_page: repoResult.currentPage,
				total_pages: repoResult.totalPages,
				total_orders: repoResult.totalOrders,
				has_next: repoResult.hasNext,
			},
		};
	},
};

export default OrderHistoryMapper;
