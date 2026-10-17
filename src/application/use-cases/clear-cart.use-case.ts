import type {
	ClearCartRequestDto,
	ClearCartResponseDto,
} from "@application/dtos/clear-cart.dto.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/clear-cart.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class ClearCartUseCase implements IClearCartUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(
		dto: ClearCartRequestDto,
	): Promise<ClearCartResponseDto> {
		const cart = await this.cartRepository.findById(dto.cartId);

		if (!cart) {
			throw new CartNotFoundError();
		}

		cart.validateAccess(dto.authenticatedUserId);

		if (cart.isExpired()) {
			if (cart.status !== CartStatus.EXPIRED) {
				await this.cartRepository.update(cart.id, {
					status: CartStatus.EXPIRED,
				});
			}
			throw new CartExpiredError();
		}

		if (cart.items.length === 0) {
			return {
				cartId: cart.id,
				restaurantId: null,
				itemCount: 0,
				subtotal: 0,
				updatedAt: cart.updatedAt.toISOString(),
				items: [],
			};
		}

		const updatedCart = await this.cartRepository.clearCart(cart.id);

		return {
			cartId: updatedCart.id,
			restaurantId: null,
			itemCount: 0,
			subtotal: 0,
			updatedAt: updatedCart.updatedAt.toISOString(),
			items: [],
		};
	}
}

export default ClearCartUseCase;
