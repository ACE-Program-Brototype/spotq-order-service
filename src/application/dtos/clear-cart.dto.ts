import type { CartMutationResponseDto } from "@application/mappers/cart-response.mapper.ts";

export interface ClearCartRequestDto {
	cartId: string;
	authenticatedUserId: string;
}

export type ClearCartResponseDto = CartMutationResponseDto;
