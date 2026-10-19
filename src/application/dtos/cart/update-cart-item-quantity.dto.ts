export interface UpdateCartItemQuantityRequestDto {
	cartId: string;
	cartItemId: string;
	quantity: number;
	authenticatedUserId: string;
}

export interface UpdateCartItemQuantityResponseItemDto {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface UpdateCartItemQuantityResponseDto {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: UpdateCartItemQuantityResponseItemDto[];
}
