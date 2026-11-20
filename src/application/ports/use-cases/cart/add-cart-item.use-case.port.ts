import type {
	AddCartItemRequestDTO,
	AddCartItemResponseDTO,
} from "@application/dtos/cart/add-cart-item.dto.ts";

export interface IAddCartItemUseCase {
	execute(dto: AddCartItemRequestDTO): Promise<AddCartItemResponseDTO>;
}
