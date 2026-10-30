import type {
	ClearCartRequestDTO,
	ClearCartResponseDTO,
} from "@application/dtos/cart/clear-cart.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart/cart-response.mapper.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/i-cart.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class ClearCartUseCase implements IClearCartUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(
		dto: ClearCartRequestDTO,
	): Promise<ClearCartResponseDTO> {
		const cart = await this.cartRepository.findById(dto.cartId);

		if (!cart) {
			throw new CartNotFoundError();
		}

		cart.validateAccess(dto.authenticatedUserId);

		if (cart.items.length === 0) {
			return CartResponseMapper.toMutationDTO(cart);
		}

		const updatedCart = await this.cartRepository.clearCart(cart.id);

		return CartResponseMapper.toMutationDTO(updatedCart);
	}
}
