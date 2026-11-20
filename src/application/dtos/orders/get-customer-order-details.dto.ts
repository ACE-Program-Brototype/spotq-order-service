import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export interface GetCustomerOrderDetailsInputDTO {
	customerId: string;
	orderId: string;
}

export interface CustomerOrderItemVariantDTO {
	variant_id: string;
	name: string;
}

export interface CustomerOrderItemAddonDTO {
	addon_id: string;
	name: string;
	price: number;
}

export interface CustomerOrderItemDTO {
	menu_item_id: string;
	name: string;
	quantity: number;
	unit_price: number;
	variant: CustomerOrderItemVariantDTO | null;
	addons: CustomerOrderItemAddonDTO[];
	line_total: number;
}

export interface CustomerOrderRestaurantDTO {
	restaurant_id: string;
	name: string | null;
}

export interface CustomerOrderPricingDTO {
	subtotal: number;
	discounts: number;
	taxes: number;
	platform_fee: number;
	grand_total: number;
	currency: string;
}

export interface CustomerOrderPaymentDTO {
	status: PaymentStatus;
	method: PaymentMode;
	payment_id: string | null;
	amount_paid: number;
}

export interface CustomerOrderStatusHistoryDTO {
	previous_status: OrderStatus | null;
	current_status: OrderStatus;
	notes: string | null;
	created_at: string;
}

export interface CustomerOrderDetailsDTO {
	order_id: string;
	order_number: string;
	restaurant: CustomerOrderRestaurantDTO;
	order_type: OrderingMode;
	status: OrderStatus;
	created_at: string;
	updated_at: string;
	table_number?: number | null;
	queue_entry_id?: string | null;
	special_instructions?: string | null;
	items: CustomerOrderItemDTO[];
	pricing: CustomerOrderPricingDTO;
	payment: CustomerOrderPaymentDTO;
	status_history: CustomerOrderStatusHistoryDTO[];
}

export interface GetCustomerOrderDetailsOutputDTO {
	order: CustomerOrderDetailsDTO;
}
