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

export interface GetCustomerOrderHistoryRepoParams {
	customerId: string;
	page: number;
	limit: number;
	status?: OrderStatus | undefined;
}

export interface CustomerOrderHistoryItemData {
	orderId: string;
	orderNumber: string;
	restaurantId: string;
	orderStatus: string;
	itemsCount: number;
	grandTotal: number;
	createdAt: Date;
}

export interface GetCustomerOrderHistoryRepoResult {
	orders: CustomerOrderHistoryItemData[];
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
}

export interface IOrderRepository {
	getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult>;
	getCustomerOrderHistory(
		params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult>;
}
