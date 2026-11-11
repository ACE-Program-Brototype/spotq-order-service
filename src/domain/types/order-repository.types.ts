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

export interface GetAdminOrdersRepoParams {
	search?: string | undefined;
	status?: OrderStatus[] | undefined;
	restaurantId?: string | undefined;
	customerId?: string | undefined;
	paymentStatus?: string | undefined;
	startDate?: Date | undefined;
	endDate?: Date | undefined;
	minAmount?: number | undefined;
	maxAmount?: number | undefined;
	sortBy?: "createdAt" | "updatedAt" | "totalAmount" | "status" | undefined;
	sortOrder?: "asc" | "desc" | undefined;
	page: number;
	limit: number;
}

export interface AdminOrderListItemData {
	orderId: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName: string | null;
	customerId: string | null;
	status: OrderStatus;
	paymentStatus: string;
	subtotal: number;
	taxAmount: number;
	totalAmount: number;
	platformFeeAssessed: number;
	createdAt: Date;
	updatedAt: Date;
}

export interface GetAdminOrdersRepoResult {
	orders: AdminOrderListItemData[];
	totalOrders: number;
	totalPages: number;
	currentPage: number;
	limit: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
	ordersByStatus: Partial<Record<OrderStatus, number>>;
	metricsTotalOrders: number;
	totalOrderValue: number;
}
