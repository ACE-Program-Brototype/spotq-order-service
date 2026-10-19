import type {
	ClearCartRequestDto,
	ClearCartResponseDto,
} from "@application/dtos/cart/clear-cart.dto.ts";

export interface IClearCartUseCase {
	execute(dto: ClearCartRequestDto): Promise<ClearCartResponseDto>;
}
