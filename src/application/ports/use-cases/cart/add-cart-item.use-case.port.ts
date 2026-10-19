import type {
	AddCartItemRequestDto,
	AddCartItemResponseDto,
} from "@application/dtos/cart/add-cart-item.dto.ts";

export interface IAddCartItemUseCase {
	execute(dto: AddCartItemRequestDto): Promise<AddCartItemResponseDto>;
}
