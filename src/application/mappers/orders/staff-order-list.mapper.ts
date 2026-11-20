import type {
	GetStaffOrdersListResponseDTO,
	StaffOrderItemDTO,
	StaffOrderListItemDTO,
} from "@application/dtos/orders/get-staff-orders.dto.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import type {
	GetStaffOrdersRepoResult,
	StaffOrderItemRepoData,
	StaffOrderListItemData,
} from "@domain/types/order-repository.types.ts";

function toItemDTO(item: StaffOrderItemRepoData): StaffOrderItemDTO {
	const hasVariant = Boolean(item.variantId || item.variantName);
	return {
		menuItemId: item.menuItemId,
		name: item.name,
		quantity: item.quantity,
		variant: hasVariant
			? {
					id: item.variantId,
					name: item.variantName,
				}
			: null,
		addons: item.addons.map((addon) => ({
			id: addon.id,
			name: addon.name,
		})),
	};
}

function toOrderItemDTO(order: StaffOrderListItemData): StaffOrderListItemDTO {
	const isQueue = order.orderType === RestaurantPlan.QUEUE_PRO;
	const queueId = isQueue ? (order.queueEntryId ?? null) : null;

	return {
		id: order.id,
		orderNumber: order.orderNumber,
		orderType: order.orderType,
		status: order.status,
		createdAt: order.createdAt.toISOString(),
		queueId,
		items: order.items.map(toItemDTO),
	};
}

export const StaffOrderListMapper = {
	toResponseDTO(
		result: GetStaffOrdersRepoResult,
	): GetStaffOrdersListResponseDTO {
		return {
			orders: result.orders.map(toOrderItemDTO),
			pagination: {
				page: result.currentPage,
				limit: result.limit,
				total: result.totalOrders,
				totalPages: result.totalPages,
			},
		};
	},
};
