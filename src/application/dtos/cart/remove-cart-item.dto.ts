export interface RemoveCartItemRequestDTO {
	cartId: string;
	cartItemId: string;
	authenticatedUserId: string;
}

export interface RemoveCartItemResponseItemDTO {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface RemoveCartItemResponseDTO {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: RemoveCartItemResponseItemDTO[];
}
