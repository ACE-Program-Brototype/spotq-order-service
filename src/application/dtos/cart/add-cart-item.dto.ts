export interface AddCartItemRequestDto {
	cartId?: string | undefined;
	authenticatedUserId: string;
	restaurantId: string;
	menuItemId: string;
	variantId?: string | null | undefined;
	addonIds?: string[] | undefined;
	quantity: number;
	specialInstructions?: string | null | undefined;
}

export interface AddCartItemResponseItemDto {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface AddCartItemResponseDto {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: AddCartItemResponseItemDto[];
}
