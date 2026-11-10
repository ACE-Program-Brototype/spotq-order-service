import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";

export interface GetOrdersOverviewRepoParams {
	restaurantId: string;
	fromDate?: Date | undefined;
	toDate?: Date | undefined;
}

export interface OrderOverviewSummaryData {
	totalOrders: number;
	grossRevenue: number;
	completedOrders: number;
	cancelledOrders: number;
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
}

export interface GetCustomerOrderHistoryRepoParams {
	customerId: string;
	page: number;
	limit: number;
	status?: OrderStatus | undefined;
}

export interface GetRestaurantOrdersRepoParams {
	restaurantId: string;
	search?: string | undefined;
	status?: OrderStatus | undefined;
	fromDate?: Date | undefined;
	toDate?: Date | undefined;
	page: number;
	limit: number;
}

export interface RestaurantOrderListItemData {
	orderId: string;
	orderNumber: string;
	orderStatus: string;
	itemsCount: number;
	grandTotal: number;
	createdAt: Date;
}

export interface GetRestaurantOrdersRepoResult {
	orders: RestaurantOrderListItemData[];
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	hasNext: boolean;
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

export interface OrderData {
	orderId: string;
	orderNumber: string;
	restaurantId: string;
	userId: string | null;
	orderStatus: string;
	cancellationReason?: string | null;
	cancelledAt?: Date | null;
	createdAt: Date;
}

export interface CancelledOrderData {
	orderId: string;
	orderNumber: string;
	status: string;
	cancellationReason: string | null;
	cancelledAt: Date | null;
}

export interface StaffOrderItemRepoData {
	menuItemId: string;
	name: string;
	quantity: number;
	variantId: string | null;
	variantName: string | null;
	addons: Array<{
		id: string;
		name: string;
	}>;
}

export interface StaffOrderListItemData {
	id: string;
	orderNumber: string;
	orderType: RestaurantPlan;
	status: OrderStatus;
	createdAt: Date;
	queueEntryId: string | null;
	items: StaffOrderItemRepoData[];
}

export interface GetStaffOrdersRepoParams {
	restaurantId: string;
	search?: string | undefined;
	status?: OrderStatus[] | undefined;
	orderType?: RestaurantPlan | undefined;
	sortOrder?: "asc" | "desc" | undefined;
	page: number;
	limit: number;
}

export interface GetStaffOrdersRepoResult {
	orders: StaffOrderListItemData[];
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	limit: number;
	hasNext: boolean;
}

export interface GetRestaurantOrderAnalyticsRepoParams {
	restaurantId: string;
	startDate: Date;
	nextPeriodStart: Date;
	prevStartDate: Date;
}

export interface OrderStatusDistributionData {
	status: string;
	count: number;
	percentage: number;
	amountRupees: number;
}

export interface RestaurantOrderAnalyticsRepoResult {
	overview: {
		revenue: {
			grossSalesRupees: number;
			discountRupees: number;
			netSalesRupees: number;
			taxCollectedRupees: number;
			totalBillAmountRupees: number;
			growthPercentage: number;
		};
		orders: {
			totalOrderCount: number;
			growthPercentage: number;
			dineInCount: number;
			takeawayCount: number;
		};
		operations: {
			dinersServedCount: number;
			uniqueCustomersCount: number;
		};
	};
	orderStatusBreakdown: {
		totalOrdersTracked: number;
		distribution: OrderStatusDistributionData[];
	};
}

export interface GetRestaurantProductAnalyticsRepoParams {
	restaurantId: string;
	startDate: Date;
	nextPeriodStart: Date;
	page: number;
	limit: number;
}

export interface ProductPerformanceItemData {
	menuItemId: string;
	name: string;
	quantitySold: number;
	grossSalesRupees: number;
	percentageOfTotalSales: number;
	classification?: "LOW_VOLUME" | "NORMAL";
}

export interface ProductAnalyticsPaginationData {
	totalItems: number;
	totalPages: number;
	currentPage: number;
	limit: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface RestaurantProductAnalyticsRepoResult {
	totalProductsSold: number;
	topSelling: {
		items: ProductPerformanceItemData[];
		pagination: ProductAnalyticsPaginationData;
	};
	slowMoving: {
		items: ProductPerformanceItemData[];
		pagination: ProductAnalyticsPaginationData;
	};
}
