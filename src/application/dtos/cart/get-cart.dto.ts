export interface GetCartRequestDto {
	authenticatedUserId: string;
	cartId?: string | undefined;
	restaurantId?: string | undefined;
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
	cartId: string | null;
	restaurantId: string | null;
	userId: string;
	status: string;
	itemCount: number;
	subtotal: number;
	createdAt: string | null;
	updatedAt: string | null;
	expiresAt: string | null;
	items: CartItemResponseDto[];
}
