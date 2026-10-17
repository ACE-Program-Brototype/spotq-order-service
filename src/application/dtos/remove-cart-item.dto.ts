export interface RemoveCartItemRequestDto {
	cartId: string;
	cartItemId: string;
	authenticatedUserId: string;
}

export interface RemoveCartItemResponseItemDto {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface RemoveCartItemResponseDto {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: RemoveCartItemResponseItemDto[];
}
