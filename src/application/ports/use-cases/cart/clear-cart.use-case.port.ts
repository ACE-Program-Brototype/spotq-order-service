import type {
	ClearCartRequestDto,
	ClearCartResponseDto,
} from "@application/dtos/clear-cart.dto.ts";

export interface IClearCartUseCase {
	execute(dto: ClearCartRequestDto): Promise<ClearCartResponseDto>;
}

export default IClearCartUseCase;
