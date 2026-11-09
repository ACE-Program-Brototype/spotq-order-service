import type {
	CustomerOrderDetailsDTO,
	CustomerOrderItemDTO,
	GetCustomerOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-customer-order-details.dto.ts";
import type { Order } from "@domain/entities/order.entity.ts";

export const CustomerOrderDetailsMapper = {
	toDTO(order: Order): GetCustomerOrderDetailsOutputDTO {
		const items: CustomerOrderItemDTO[] = order.items.map((item) => ({
			menu_item_id: item.menuItemId,
			name: item.itemName,
			quantity: item.quantity,
			unit_price: item.unitPrice,
			variant: item.variantId
				? {
						variant_id: item.variantId,
						name: item.variantName ?? "",
					}
				: null,
			addons: item.addons.map((addon) => ({
				addon_id: addon.addonId,
				name: addon.addonName,
				price: addon.price,
			})),
			line_total: item.totalPrice,
		}));

		const orderDetails: CustomerOrderDetailsDTO = {
			order_id: order.id,
			order_number: order.orderNumber,
			restaurant: {
				restaurant_id: order.restaurantId,
				name: order.restaurantName,
			},
			order_type: order.orderingMode,
			status: order.orderStatus,
			created_at: order.createdAt.toISOString(),
			updated_at: order.updatedAt.toISOString(),
			table_number: order.tableNumber,
			queue_entry_id: order.queueEntryId,
			special_instructions: order.specialInstructions,
			items,
			pricing: {
				subtotal: order.subtotal,
				discounts: order.discountAmount,
				taxes: order.taxAmount,
				platform_fee: order.platformFee,
				grand_total: order.grandTotal,
				currency: "INR",
			},
		};

		return {
			order: orderDetails,
		};
	},
};
