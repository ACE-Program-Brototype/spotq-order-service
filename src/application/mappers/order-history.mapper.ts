import type {
	OrderHistoryItemDTO,
	OrderHistoryResponseDTO,
	OrderHistoryResponseDto,
} from "@application/dtos/orders/get-order-history.dto.ts";
import type { GetCustomerOrderHistoryRepoResult } from "@domain/types/order-repository.types";

export const OrderHistoryMapper = {
	toDTO(
		repoResult: GetCustomerOrderHistoryRepoResult,
	): OrderHistoryResponseDTO {
		const orders: OrderHistoryItemDTO[] = repoResult.orders.map((order) => ({
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

	toResponseDto(
		repoResult: GetCustomerOrderHistoryRepoResult,
	): OrderHistoryResponseDto {
		return this.toDTO(repoResult);
	},
};

export default OrderHistoryMapper;
