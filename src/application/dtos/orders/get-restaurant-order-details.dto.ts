import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderType } from "@domain/enums/order-type.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export interface GetRestaurantOrderDetailsInputDTO {
	restaurantId: string;
	orderId: string;
}

export interface RestaurantOrderAddonDTO {
	addonId: string;
	addonName: string;
	price: number;
}

export interface RestaurantOrderItemDTO {
	itemId: string;
	menuItemId: string;
	itemName: string;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: RestaurantOrderAddonDTO[];
}

export interface RestaurantOrderStatusHistoryDTO {
	previousStatus: OrderStatus | null;
	currentStatus: OrderStatus;
	changedBy: string;
	notes: string | null;
	createdAt: Date;
}

export interface GetRestaurantOrderDetailsOutputDTO {
	orderId: string;
	orderNumber: string;
	orderStatus: OrderStatus;
	orderType: OrderType;
	paymentMode: PaymentMode;
	paymentStatus: PaymentStatus;

	customer: {
		userId: string | null;
		name: string | null;
		phone: string | null;
	};

	tableNumber: number | null;
	estimatedReadyAt: Date | null;
	createdAt: Date;
	updatedAt: Date;

	items: RestaurantOrderItemDTO[];
	statusHistory: RestaurantOrderStatusHistoryDTO[];

	pricing: {
		subtotal: number;
		taxAmount: number;
		discountAmount: number;
		couponCode: string | null;
		platformFee: number;
		grandTotal: number;
	};

	specialInstructions: string | null;
	cancellationReason: string | null;
	cancelledAt: Date | null;
}
