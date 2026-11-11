import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	GetRestaurantOrdersRepoParams,
	GetRestaurantOrdersRepoResult,
	GetStaffOrdersRepoParams,
	GetStaffOrdersRepoResult,
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
}
