import type {
	CustomerOrderDetailsDTO,
	CustomerOrderItemDTO,
	CustomerOrderPaymentDTO,
	CustomerOrderStatusHistoryDTO,
	GetCustomerOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-customer-order-details.dto.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export const CustomerOrderDetailsMapper = {
	toResponseDTO(order: Order): GetCustomerOrderDetailsOutputDTO {
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

		const statusHistory: CustomerOrderStatusHistoryDTO[] = (
			order.statusHistory ?? []
		).map((history) => ({
			previous_status: history.previousStatus,
			current_status: history.currentStatus,
			notes: history.notes,
			created_at:
				history.createdAt instanceof Date
					? history.createdAt.toISOString()
					: new Date(history.createdAt).toISOString(),
		}));

		const isPaid = order.paymentStatus === PaymentStatus.PAID;
		const payment: CustomerOrderPaymentDTO = {
			status: order.paymentStatus,
			method: order.paymentMode,
			payment_id: order.paymentId ?? null,
			amount_paid: isPaid ? order.grandTotal : 0,
		};

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
			payment,
			status_history: statusHistory,
		};

		return {
			order: orderDetails,
		};
	},
};
