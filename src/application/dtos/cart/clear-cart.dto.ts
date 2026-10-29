import type { CartMutationResponseDTO } from "@application/mappers/cart-response.mapper.ts";

export interface ClearCartRequestDTO {
	cartId: string;
	authenticatedUserId: string;
}

export type ClearCartResponseDTO = CartMutationResponseDTO;

// Backwards-compatible aliases
export type ClearCartRequestDto = ClearCartRequestDTO;
export type ClearCartResponseDto = ClearCartResponseDTO;
