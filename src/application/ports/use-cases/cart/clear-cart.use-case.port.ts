import type {
	ClearCartRequestDTO,
	ClearCartResponseDTO,
} from "@application/dtos/cart/clear-cart.dto.ts";

export interface IClearCartUseCase {
	execute(dto: ClearCartRequestDTO): Promise<ClearCartResponseDTO>;
}
