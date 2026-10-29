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

export interface CheckoutDetailsResponseDto {
	cartId: string;
	restaurantId: string;
	restaurantName: string;
	itemCount: number;
	subtotal: number;
	taxPercent: number;
	taxAmount: number;
	totalAmount: number;
	items: CheckoutItemDto[];
}
