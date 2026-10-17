export interface ClearCartRequestDto {
	cartId: string;
	authenticatedUserId: string;
}

export interface ClearCartResponseDto {
	cartId: string;
	restaurantId: string | null;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: unknown[];
}
