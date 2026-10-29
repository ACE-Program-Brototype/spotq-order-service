export interface AddCartItemRequestDTO {
	cartId?: string | undefined;
	authenticatedUserId: string;
	restaurantId: string;
	menuItemId: string;
	variantId?: string | null | undefined;
	addonIds?: string[] | undefined;
	quantity: number;
	specialInstructions?: string | null | undefined;
}

export interface AddCartItemResponseItemDTO {
	cartItemId: string;
	menuItemId: string;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
}

export interface AddCartItemResponseDTO {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: AddCartItemResponseItemDTO[];
}

// Backwards-compatible aliases
export type AddCartItemRequestDto = AddCartItemRequestDTO;
export type AddCartItemResponseItemDto = AddCartItemResponseItemDTO;
export type AddCartItemResponseDto = AddCartItemResponseDTO;
