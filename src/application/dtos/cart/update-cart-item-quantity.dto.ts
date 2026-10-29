export interface UpdateCartItemQuantityRequestDTO {
	cartId: string;
	cartItemId: string;
	quantity: number;
	authenticatedUserId: string;
}

export interface UpdateCartItemQuantityResponseItemDTO {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface UpdateCartItemQuantityResponseDTO {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: UpdateCartItemQuantityResponseItemDTO[];
}

// Backwards-compatible aliases
export type UpdateCartItemQuantityRequestDto = UpdateCartItemQuantityRequestDTO;
export type UpdateCartItemQuantityResponseItemDto =
	UpdateCartItemQuantityResponseItemDTO;
export type UpdateCartItemQuantityResponseDto =
	UpdateCartItemQuantityResponseDTO;
