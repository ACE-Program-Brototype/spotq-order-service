import type { GetCartResponseDto } from "@application/dtos/cart/get-cart.dto.ts";

export interface BatchCartItemInputDTO {
	menuItemId: string;
	variantId?: string | null | undefined;
	addonIds?: string[] | undefined;
	quantity: number;
	specialInstructions?: string | null | undefined;
}

export interface AddBatchCartItemsDTO {
	authenticatedUserId: string;
	restaurantId: string;
	items: BatchCartItemInputDTO[];
}

export type AddBatchCartItemsResponseDTO = GetCartResponseDto;
