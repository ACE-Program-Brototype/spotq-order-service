import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";

export interface GetStaffOrdersListInputDTO {
	restaurantId: string;
	search?: string | undefined;
	status?: OrderStatus[] | undefined;
	orderType?: RestaurantPlan | undefined;
	sortOrder?: "asc" | "desc" | undefined;
	page: number;
	limit: number;
}

export interface StaffOrderItemVariantDTO {
	id: string | null;
	name: string | null;
}

export interface StaffOrderItemAddonDTO {
	id: string;
	name: string;
}

export interface StaffOrderItemDTO {
	menuItemId: string;
	name: string;
	quantity: number;
	variant: StaffOrderItemVariantDTO | null;
	addons: StaffOrderItemAddonDTO[];
}

export interface StaffOrderListItemDTO {
	id: string;
	orderNumber: string;
	orderType: string;
	status: string;
	createdAt: string;
	queueId: string | null;
	items: StaffOrderItemDTO[];
}

export interface StaffOrdersPaginationDTO {
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface GetStaffOrdersListResponseDTO {
	orders: StaffOrderListItemDTO[];
	pagination: StaffOrdersPaginationDTO;
}
