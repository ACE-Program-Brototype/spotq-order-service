import type { OrderPriority } from "@domain/enums/order-priority.enum.ts";
import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderType } from "@domain/enums/order-type.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export interface PlaceOrderInputDTO {
	userId: string;
	restaurantId: string;
	cartId?: string | undefined;
	paymentMode: PaymentMode;
	specialInstructions?: string | undefined;
	userName?: string | undefined;
	userPhone?: string | undefined;
}

export interface OrderItemAddonResponseDTO {
	id: string;
	addonId: string;
	addonName: string;
	price: number;
}

export interface OrderItemResponseDTO {
	id: string;
	menuItemId: string;
	itemName: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: OrderItemAddonResponseDTO[];
}

export interface OrderResponseDTO {
	id: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName: string | null;
	userId: string | null;
	userName: string | null;
	userPhone: string | null;
	tableId: string | null;
	tableNumber: number | null;
	queueEntryId: string | null;
	priority: OrderPriority | number;
	orderType: OrderType;
	paymentMode: PaymentMode;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	subtotal: number;
	taxAmount: number;
	platformFee: number;
	discountAmount: number;
	grandTotal: number;
	specialInstructions: string | null;
	items: OrderItemResponseDTO[];
	createdAt: string;
}

// Backwards-compatible aliases
export type PlaceOrderInputDto = PlaceOrderInputDTO;
export type OrderItemAddonResponseDto = OrderItemAddonResponseDTO;
export type OrderItemResponseDto = OrderItemResponseDTO;
export type OrderResponseDto = OrderResponseDTO;
