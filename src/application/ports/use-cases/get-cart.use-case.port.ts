import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/get-cart.dto.ts";

export interface IGetCartUseCase {
	execute(dto: GetCartRequestDto): Promise<GetCartResponseDto>;
}

export default IGetCartUseCase;
