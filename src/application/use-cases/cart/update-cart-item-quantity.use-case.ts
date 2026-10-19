import type {
	UpdateCartItemQuantityRequestDto,
	UpdateCartItemQuantityResponseDto,
} from "@application/dtos/cart/update-cart-item-quantity.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class UpdateCartItemQuantityUseCase
	implements IUpdateCartItemQuantityUseCase
{
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
		@inject(TYPES.MenuItemCatalogPort)
		private readonly catalogPort: IMenuItemCatalogPort,
	) {}

	public async execute(
		dto: UpdateCartItemQuantityRequestDto,
	): Promise<UpdateCartItemQuantityResponseDto> {
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

		if (dto.quantity > 0) {
			const addonIds = targetItem.addons.map((a) => a.addonId);
			const catalogItem = await this.catalogPort.getItemDetails(
				cart.restaurantId,
				targetItem.menuItemId,
				targetItem.variantId,
				addonIds.length > 0 ? addonIds : undefined,
			);

			validateCatalogItemAvailability(
				catalogItem,
				targetItem.variantId,
				addonIds,
			);
		}

		const updatedCart = await this.cartRepository.updateItemQuantity(
			cart.id,
			dto.cartItemId,
			dto.quantity,
		);

		return CartResponseMapper.toMutationDto(updatedCart);
	}
}
