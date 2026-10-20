import type {
	RemoveCartItemRequestDto,
	RemoveCartItemResponseDto,
} from "@application/dtos/cart/remove-cart-item.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class RemoveCartItemUseCase implements IRemoveCartItemUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
	) {}

	public async execute(
		dto: RemoveCartItemRequestDto,
	): Promise<RemoveCartItemResponseDto> {
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

		const targetItem = cart.items.find((item) => item.id === dto.cartItemId);
		if (!targetItem) {
			throw new CartItemNotFoundError();
		}

		const updatedCart = await this.cartRepository.removeItem(
			cart.id,
			dto.cartItemId,
		);

		return CartResponseMapper.toMutationDto(updatedCart);
	}
}
