import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/cart/get-cart.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetCartUseCase implements IGetCartUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(dto: GetCartRequestDto): Promise<GetCartResponseDto> {
		if (dto.cartId) {
			const cart = await this.cartRepository.findById(dto.cartId);

			if (!cart) {
				throw new CartNotFoundError();
			}

			cart.validateAccess(dto.authenticatedUserId);
			cart.validateActive();

			return CartResponseMapper.toDto(cart);
		}

		const activeCart = await this.cartRepository.findActiveByUserId(
			dto.authenticatedUserId,
			dto.restaurantId,
		);

		if (!activeCart || activeCart.isExpired()) {
			return CartResponseMapper.toEmptyDto(
				dto.authenticatedUserId,
				dto.restaurantId,
			);
		}

		return CartResponseMapper.toDto(activeCart);
	}
}
