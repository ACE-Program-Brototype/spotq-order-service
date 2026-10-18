import type {
	UpdateCartItemQuantityRequestDto,
	UpdateCartItemQuantityResponseDto,
} from "@application/dtos/update-cart-item-quantity.dto.ts";

export interface IUpdateCartItemQuantityUseCase {
	execute(
		dto: UpdateCartItemQuantityRequestDto,
	): Promise<UpdateCartItemQuantityResponseDto>;
}

export default IUpdateCartItemQuantityUseCase;
