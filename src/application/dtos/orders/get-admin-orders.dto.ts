import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export type AdminOrdersSortField =
	| "createdAt"
	| "updatedAt"
	| "totalAmount"
	| "status";

export interface GetAdminOrdersInputDTO {
	search?: string | undefined;
	status?: OrderStatus[] | undefined;
	restaurantId?: string | undefined;
	customerId?: string | undefined;
	paymentStatus?: PaymentStatus | undefined;
	startDate?: Date | undefined;
	endDate?: Date | undefined;
	minAmount?: number | undefined;
	maxAmount?: number | undefined;
	sortBy?: AdminOrdersSortField | undefined;
	sortOrder?: "asc" | "desc" | undefined;
	page: number;
	limit: number;
}

export interface AdminOrderSummaryDTO {
	orderId: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName: string | null;
	customerId: string | null;
	status: OrderStatus;
	paymentStatus: PaymentStatus;
	subtotal: number;
	taxAmount: number;
	totalAmount: number;
	platformFeeAssessed: number;
	paymentReference: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface AdminOrdersPaginationDTO {
	currentPage: number;
	limit: number;
	totalPages: number;
	totalOrders: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface AdminOrdersMetricsDTO {
	totalOrders: number;
	ordersByStatus: Partial<Record<OrderStatus, number>>;
	totalOrderValue: number;
}

export interface GetAdminOrdersResponseDTO {
	orders: AdminOrderSummaryDTO[];
	pagination: AdminOrdersPaginationDTO;
	metrics: AdminOrdersMetricsDTO;
}
