import type {
	RemoveCartItemRequestDTO,
	RemoveCartItemResponseDTO,
} from "@application/dtos/cart/remove-cart-item.dto.ts";

export interface IRemoveCartItemUseCase {
	execute(dto: RemoveCartItemRequestDTO): Promise<RemoveCartItemResponseDTO>;
}
