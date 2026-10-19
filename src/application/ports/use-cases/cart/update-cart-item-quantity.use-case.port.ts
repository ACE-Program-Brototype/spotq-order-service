import type {
	UpdateCartItemQuantityRequestDto,
	UpdateCartItemQuantityResponseDto,
} from "@application/dtos/cart/update-cart-item-quantity.dto.ts";

export interface IUpdateCartItemQuantityUseCase {
	execute(
		dto: UpdateCartItemQuantityRequestDto,
	): Promise<UpdateCartItemQuantityResponseDto>;
}
