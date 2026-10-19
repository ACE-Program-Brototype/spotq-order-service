import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/cart/get-cart.dto.ts";

export interface IGetCartUseCase {
	execute(dto: GetCartRequestDto): Promise<GetCartResponseDto>;
}
