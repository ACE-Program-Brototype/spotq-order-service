import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";

export interface GetOrdersOverviewRepoParams {
	restaurantId: string;
	fromDate?: Date | undefined;
	toDate?: Date | undefined;
	status?: OrderStatus | undefined;
	search?: string | undefined;
	page: number;
	limit: number;
}

export interface OrderOverviewSummaryData {
	totalOrders: number;
	grossRevenue: number;
	completedOrders: number;
	cancelledOrders: number;
	pendingOrders: number;
	preparingOrders: number;
	readyOrders: number;
}

export interface OrderOverviewItemData {
	orderId: string;
	orderNumber: string;
	orderStatus: string;
	userId: string | null;
	grandTotal: number;
	itemsCount: number;
	createdAt: Date;
}

export interface OrderOverviewPaginationData {
	currentPage: number;
	totalPages: number;
	totalItems: number;
}

export interface GetOrdersOverviewRepoResult {
	summary: OrderOverviewSummaryData;
	orders: OrderOverviewItemData[];
	pagination: OrderOverviewPaginationData;
}

export interface IOrderRepository {
	create(order: Order, cartIdToClear?: string): Promise<Order>;
	findById(id: string): Promise<Order | null>;
	findActiveByUserId(
		restaurantId: string,
		userId: string,
	): Promise<Order | null>;
	getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult>;
}
