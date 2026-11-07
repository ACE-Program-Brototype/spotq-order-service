import type {
	GetStaffOrderDetailsOutputDTO,
	StaffOrderAddonDTO,
	StaffOrderItemDTO,
} from "@application/dtos/orders/get-staff-order-details.dto.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import type { OrderItem } from "@domain/entities/order-item.entity.ts";

export const StaffOrderDetailsMapper = {
	toDTO(order: Order): GetStaffOrderDetailsOutputDTO {
		const items: StaffOrderItemDTO[] = (order.items ?? []).map(
			(item: OrderItem) => {
				const addons: StaffOrderAddonDTO[] = (item.addons ?? []).map(
					(addon) => ({
						addon_id: addon.addonId,
						name: addon.addonName,
					}),
				);

				return {
					menu_item_id: item.menuItemId,
					name: item.itemName,
					variant_id: item.variantId ?? null,
					variant_name: item.variantName ?? null,
					addons,
					quantity: item.quantity,
					special_instructions: item.specialInstructions?.trim() || null,
				};
			},
		);

		return {
			order_id: order.id,
			order_number: order.orderNumber,
			status: order.orderStatus,
			customer_notes: order.specialInstructions?.trim() || null,
			items,
			created_at:
				order.createdAt instanceof Date
					? order.createdAt.toISOString()
					: new Date(order.createdAt).toISOString(),
		};
	},
};
