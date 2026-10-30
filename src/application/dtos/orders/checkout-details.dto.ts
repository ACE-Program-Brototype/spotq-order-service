import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";

export interface GetCheckoutDetailsInputDTO {
	userId: string;
	restaurantId?: string | undefined;
	cartId?: string | undefined;
}

export interface CheckoutItemAddonDTO {
	addonId: string;
	name: string;
	price: number;
}

export interface CheckoutItemDTO {
	cartItemId: string;
	menuItemId: string;
	name: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: CheckoutItemAddonDTO[];
}

export interface CheckoutPaymentContractDTO {
	mode: PaymentMode;
	paymentRequired: boolean;
}

export interface CheckoutDetailsResponseDTO {
	cartId: string;
	restaurantId: string;
	restaurantName: string;
	payment: CheckoutPaymentContractDTO;
	itemCount: number;
	subtotal: number;
	taxPercent: number;
	taxAmount: number;
	totalAmount: number;
	items: CheckoutItemDTO[];
}
