import type { OrdersOverviewResponseDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetOrdersOverviewRepoResult } from "@domain/types/order-repository.types";

export const OrdersOverviewMapper = {
	toDTO(repoResult: GetOrdersOverviewRepoResult): OrdersOverviewResponseDTO {
		return {
			summary: {
				total_orders: repoResult.summary.totalOrders,
				gross_revenue: Number(repoResult.summary.grossRevenue.toFixed(2)),
				completed_orders: repoResult.summary.completedOrders,
				cancelled_orders: repoResult.summary.cancelledOrders,
			},
		};
	},
};
