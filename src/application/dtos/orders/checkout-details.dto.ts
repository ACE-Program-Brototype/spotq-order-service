import type { PaymentMode } from "@domain/enums/payment-mode.enum.ts";

export interface GetCheckoutDetailsInputDto {
	userId: string;
	restaurantId?: string | undefined;
	cartId?: string | undefined;
}

export interface CheckoutItemAddonDto {
	addonId: string;
	name: string;
	price: number;
}

export interface CheckoutItemDto {
	cartItemId: string;
	menuItemId: string;
	name: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: CheckoutItemAddonDto[];
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
	items: CheckoutItemDto[];
}
