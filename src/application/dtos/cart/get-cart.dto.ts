export interface CartItemAddonResponseDTO {
	addonId: string;
	addonName: string;
	price: number;
}

export interface CartItemResponseDTO {
	cartItemId: string;
	menuItemId: string;
	menuItemName: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	unitPrice: number;
	totalPrice: number;
	specialInstructions: string | null;
	addons: CartItemAddonResponseDTO[];
}

export interface GetCartRequestDTO {
	cartId: string;
	authenticatedUserId: string;
}

export interface GetCartResponseDTO {
	cartId: string;
	restaurantId: string;
	userId: string;
	status: string;
	itemCount: number;
	subtotal: number;
	createdAt: string;
	updatedAt: string;
	expiresAt: string;
	items: CartItemResponseDTO[];
}

// Backwards-compatible aliases
export type GetCartRequestDto = GetCartRequestDTO;
export type CartItemAddonResponseDto = CartItemAddonResponseDTO;
export type CartItemResponseDto = CartItemResponseDTO;
export type GetCartResponseDto = GetCartResponseDTO;
