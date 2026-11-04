import type { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

export interface PlaceOrderInputDTO {
	userId: string;
	restaurantId: string;
	cartId: string;
	tableId?: string | null | undefined;
	idempotencyKey?: string | null | undefined;
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

export interface PaymentDraftResponseDTO {
	paymentId: string;
	orderId: string;
	razorpayOrderId: string;
	amountPaise: number;
	currency: string;
	keyId: string;
}

export interface OrderResponseDTO {
	id: string;
	orderNumber: string;
	restaurantId: string;
	restaurantName: string | null;
	restaurantPlan: string | null;
	userId: string | null;
	userName: string | null;
	userPhone: string | null;
	tableId: string | null;
	tableNumber: number | null;
	queueEntryId: string | null;
	paymentId: string | null;
	orderingMode: OrderingMode;
	paymentMode: PaymentMode;
	paymentStatus: PaymentStatus;
	orderStatus: OrderStatus;
	subtotal: number;
	taxAmount: number;
	platformFee: number;
	discountAmount: number;
	grandTotal: number;
	estimatedReadyAt: string | null;
	specialInstructions: string | null;
	paymentDraft?: PaymentDraftResponseDTO | null;
	items: OrderItemResponseDTO[];
	createdAt: string;
}
