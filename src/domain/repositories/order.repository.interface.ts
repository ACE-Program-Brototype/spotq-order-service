import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
} from "@domain/types/order-repository.types.ts";

export interface IOrderRepository {
	getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult>;
	getCustomerOrderHistory(
		params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult>;
	findById(orderId: string): Promise<Order | null>;
	cancelOrder(
		order: Order,
		previousStatus: OrderStatus,
	): Promise<CancelledOrderData>;
}
