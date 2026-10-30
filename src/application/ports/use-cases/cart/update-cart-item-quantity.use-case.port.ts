import type {
	UpdateCartItemQuantityRequestDTO,
	UpdateCartItemQuantityResponseDTO,
} from "@application/dtos/cart/update-cart-item-quantity.dto.ts";

export interface IUpdateCartItemQuantityUseCase {
	execute(
		dto: UpdateCartItemQuantityRequestDTO,
	): Promise<UpdateCartItemQuantityResponseDTO>;
}
