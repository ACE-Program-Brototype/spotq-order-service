import type { CartMutationResponseDTO } from "@application/mappers/cart/cart-response.mapper.ts";

export interface ClearCartRequestDTO {
	cartId: string;
	authenticatedUserId: string;
}

export type ClearCartResponseDTO = CartMutationResponseDTO;
