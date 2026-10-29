import type { OrderResponseDTO } from "@application/dtos/orders/place-order.dto.ts";
import type { Order } from "@domain/entities/order.entity.ts";

export const OrderResponseMapper = {
	toDTO(order: Order): OrderResponseDTO {
		return {
			id: order.id,
			orderNumber: order.orderNumber,
			restaurantId: order.restaurantId,
			restaurantName: order.restaurantName,
			userId: order.userId,
			userName: order.userName,
			userPhone: order.userPhone,
			tableId: order.tableId,
			tableNumber: order.tableNumber,
			queueEntryId: order.queueEntryId,
			priority: order.priority,
			orderType: order.orderType,
			paymentMode: order.paymentMode,
			paymentStatus: order.paymentStatus,
			orderStatus: order.orderStatus,
			subtotal: order.subtotal,
			taxAmount: order.taxAmount,
			platformFee: order.platformFee,
			discountAmount: order.discountAmount,
			grandTotal: order.grandTotal,
			specialInstructions: order.specialInstructions,
			items: order.items.map((item) => ({
				id: item.id,
				menuItemId: item.menuItemId,
				itemName: item.itemName,
				variantId: item.variantId,
				variantName: item.variantName,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				specialInstructions: item.specialInstructions,
				addons: item.addons.map((addon) => ({
					id: addon.id,
					addonId: addon.addonId,
					addonName: addon.addonName,
					price: addon.price,
				})),
			})),
			createdAt: order.createdAt.toISOString(),
		};
	},

	toDto(order: Order): OrderResponseDTO {
		return OrderResponseMapper.toDTO(order);
	},
};
