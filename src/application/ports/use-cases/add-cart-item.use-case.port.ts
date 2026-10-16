import type {
	AddCartItemRequestDto,
	AddCartItemResponseDto,
} from "@application/dtos/add-cart-item.dto.ts";

export interface IAddCartItemUseCase {
	execute(dto: AddCartItemRequestDto): Promise<AddCartItemResponseDto>;
}

export default IAddCartItemUseCase;
