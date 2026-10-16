import type {
	UpdateCartItemQuantityRequestDto,
	UpdateCartItemQuantityResponseDto,
} from "@application/dtos/update-cart-item-quantity.dto.ts";
import type { IMenuItemCatalogPort } from "@application/ports/gateways/menu-item-catalog.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/update-cart-item-quantity.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
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

		if (cart.userId !== dto.authenticatedUserId) {
			throw new ForbiddenCartAccessError();
		}

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

			if (!catalogItem) {
				throw new MenuItemNotFoundError();
			}

			if (!catalogItem.isAvailable) {
				throw new ItemUnavailableError();
			}

			if (targetItem.variantId) {
				if (!catalogItem.variant) {
					throw new MenuItemNotFoundError();
				}
				if (!catalogItem.variant.isAvailable) {
					throw new ItemUnavailableError();
				}
			}

			if (addonIds.length > 0) {
				const requestedAddonSet = new Set(addonIds);
				const foundAddonMap = new Map(
					catalogItem.addons.map((a) => [a.addonId, a]),
				);

				for (const addonId of requestedAddonSet) {
					const addon = foundAddonMap.get(addonId);
					if (!addon) {
						throw new MenuItemNotFoundError();
					}
					if (!addon.isAvailable) {
						throw new ItemUnavailableError();
					}
				}
			}
		}

		const updatedCart = await this.cartRepository.updateItemQuantity(
			cart.id,
			dto.cartItemId,
			dto.quantity,
		);

		return {
			cartId: updatedCart.id,
			restaurantId: updatedCart.restaurantId,
			itemCount: updatedCart.calculateItemCount(),
			subtotal: updatedCart.calculateSubtotal(),
			updatedAt: updatedCart.updatedAt.toISOString(),
			items: updatedCart.items.map((item) => ({
				cartItemId: item.id,
				menuItemId: item.menuItemId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
			})),
		};
	}
}

export default UpdateCartItemQuantityUseCase;
