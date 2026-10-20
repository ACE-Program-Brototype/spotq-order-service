import type {
	RemoveCartItemRequestDto,
	RemoveCartItemResponseDto,
} from "@application/dtos/cart/remove-cart-item.dto.ts";

export interface IRemoveCartItemUseCase {
	execute(dto: RemoveCartItemRequestDto): Promise<RemoveCartItemResponseDto>;
}
