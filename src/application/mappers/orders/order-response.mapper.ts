import type {
	OrderResponseDTO,
	PaymentDraftResponseDTO,
} from "@application/dtos/orders/place-order.dto.ts";
import type { Order } from "@domain/entities/order.entity.ts";

export const OrderResponseMapper = {
	toDTO(
		order: Order,
		paymentDraft?: PaymentDraftResponseDTO | null,
	): OrderResponseDTO {
		return {
			id: order.id,
			orderNumber: order.orderNumber,
			restaurantId: order.restaurantId,
			restaurantName: order.restaurantName,
			restaurantPlan: order.restaurantPlan,
			userId: order.userId,
			userName: order.userName,
			userPhone: order.userPhone,
			tableId: order.tableId,
			tableNumber: order.tableNumber,
			queueEntryId: order.queueEntryId,
			paymentId: order.paymentId,
			orderingMode: order.orderingMode,
			paymentMode: order.paymentMode,
			paymentStatus: order.paymentStatus,
			orderStatus: order.orderStatus,
			subtotal: order.subtotal,
			taxAmount: order.taxAmount,
			platformFee: order.platformFee,
			discountAmount: order.discountAmount,
			grandTotal: order.grandTotal,
			estimatedReadyAt: order.estimatedReadyAt?.toISOString() ?? null,
			specialInstructions: order.specialInstructions,
			paymentDraft: paymentDraft ?? null,
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
};
