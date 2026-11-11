import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	GetRestaurantOrderAnalyticsRepoParams,
	GetRestaurantOrdersRepoParams,
	GetRestaurantOrdersRepoResult,
	GetRestaurantProductAnalyticsRepoParams,
	GetStaffOrdersRepoParams,
	GetStaffOrdersRepoResult,
	RestaurantOrderAnalyticsRepoResult,
	RestaurantProductAnalyticsRepoResult,
} from "@domain/types/order-repository.types.ts";

export interface IOrderRepository {
	create(order: Order, cartIdToClear?: string): Promise<Order>;
	findById(orderId: string): Promise<Order | null>;
	findByIdempotencyKey(key: string): Promise<Order | null>;
	findActiveByUserId(
		restaurantId: string,
		userId: string,
	): Promise<Order | null>;
	getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult>;
	getCustomerOrderHistory(
		params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult>;
	cancelOrder(
		order: Order,
		previousStatus: OrderStatus,
		auditNote?: string,
	): Promise<CancelledOrderData>;
	updatePaymentReference(orderId: string, paymentId: string): Promise<void>;
	updatePaymentAndOrderStatus(
		orderId: string,
		paymentStatus: PaymentStatus,
		orderStatus?: OrderStatus,
		reason?: string,
		paymentId?: string,
	): Promise<void>;
	getRestaurantOrders(
		params: GetRestaurantOrdersRepoParams,
	): Promise<GetRestaurantOrdersRepoResult>;
	getStaffOrders(
		params: GetStaffOrdersRepoParams,
	): Promise<GetStaffOrdersRepoResult>;
	findByRestaurantAndOrderId(
		restaurantId: string,
		orderId: string,
	): Promise<Order | null>;
	findByCustomerAndOrderId(
		customerId: string,
		orderId: string,
	): Promise<Order | null>;
	updateOrderStatus(
		order: Order,
		previousStatus: OrderStatus,
		actorId: string,
		notes?: string | null,
	): Promise<Order>;
	getRestaurantOrderAnalytics(
		params: GetRestaurantOrderAnalyticsRepoParams,
	): Promise<RestaurantOrderAnalyticsRepoResult>;
	getRestaurantProductAnalytics(
		params: GetRestaurantProductAnalyticsRepoParams,
	): Promise<RestaurantProductAnalyticsRepoResult>;
}
