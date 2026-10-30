import type {
	GetCartRequestDTO,
	GetCartResponseDTO,
} from "@application/dtos/cart/get-cart.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart/cart-response.mapper.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartNotFoundError } from "@domain/errors/cart.errors.ts";
import type { ICartRepository } from "@domain/repositories/i-cart.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetCartUseCase implements IGetCartUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(dto: GetCartRequestDTO): Promise<GetCartResponseDTO> {
		const cart = await this.cartRepository.findById(dto.cartId);

		if (!cart) {
			throw new CartNotFoundError();
		}

		cart.validateAccess(dto.authenticatedUserId);
		cart.validateActive();

		return CartResponseMapper.toDTO(cart);
	}
}
