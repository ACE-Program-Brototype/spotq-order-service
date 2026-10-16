import type {
	RemoveCartItemRequestDto,
	RemoveCartItemResponseDto,
} from "@application/dtos/remove-cart-item.dto.ts";

export interface IRemoveCartItemUseCase {
	execute(dto: RemoveCartItemRequestDto): Promise<RemoveCartItemResponseDto>;
}

export default IRemoveCartItemUseCase;
