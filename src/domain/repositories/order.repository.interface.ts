import type { Prisma } from "@generated/prisma/client.ts";
import type { OrderStatus } from "@generated/prisma/enums.ts";

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
	grossRevenue: Prisma.Decimal;
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
	grandTotal: Prisma.Decimal;
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
	getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult>;
}
