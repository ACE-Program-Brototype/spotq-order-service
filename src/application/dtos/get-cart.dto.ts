export interface GetCartRequestDto {
	cartId: string;
	authenticatedUserId: string;
}

export interface CartItemAddonResponseDto {
	addonId: string;
	addonName: string;
	price: number;
}

export interface CartItemResponseDto {
	cartItemId: string;
	menuItemId: string;
	menuItemName: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: CartItemAddonResponseDto[];
}

export interface GetCartResponseDto {
	cartId: string;
	restaurantId: string;
	userId: string;
	status: string;
	itemCount: number;
	subtotal: number;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	items: CartItemResponseDto[];
}
