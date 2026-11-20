import type {
	GetCartRequestDTO,
	GetCartResponseDTO,
} from "@application/dtos/cart/get-cart.dto.ts";

export interface IGetCartUseCase {
	execute(dto: GetCartRequestDTO): Promise<GetCartResponseDTO>;
}
