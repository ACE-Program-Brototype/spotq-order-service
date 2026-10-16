import type {
	AddCartItemRequestDto,
	AddCartItemResponseDto,
} from "@application/dtos/add-cart-item.dto.ts";
import type { IMenuItemCatalogPort } from "@application/ports/gateways/menu-item-catalog.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class AddCartItemUseCase implements IAddCartItemUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
		@inject(TYPES.MenuItemCatalogPort)
		private readonly catalogPort: IMenuItemCatalogPort,
	) {}

	public async execute(
		dto: AddCartItemRequestDto,
	): Promise<AddCartItemResponseDto> {
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

		if (cart.restaurantId !== dto.restaurantId) {
			throw new DifferentRestaurantCartError();
		}

		const catalogItem = await this.catalogPort.getItemDetails(
			dto.restaurantId,
			dto.menuItemId,
			dto.variantId,
			dto.addonIds,
		);

		if (!catalogItem) {
			throw new MenuItemNotFoundError();
		}

		if (!catalogItem.isAvailable) {
			throw new ItemUnavailableError();
		}

		if (dto.variantId) {
			if (!catalogItem.variant) {
				throw new MenuItemNotFoundError();
			}
			if (!catalogItem.variant.isAvailable) {
				throw new ItemUnavailableError();
			}
		}

		if (dto.addonIds && dto.addonIds.length > 0) {
			const requestedAddonSet = new Set(dto.addonIds);
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

		const unitPrice = catalogItem.variant?.price ?? catalogItem.price;
		const itemAddons = (catalogItem.addons ?? []).map((a) => ({
			addonId: a.addonId,
			name: a.name,
			price: a.price,
		}));

		const updatedCart = await this.cartRepository.addItem({
			cartId: cart.id,
			menuItemId: dto.menuItemId,
			menuItemName: catalogItem.name,
			variantId: dto.variantId ?? null,
			variantName: catalogItem.variant?.name ?? null,
			addonIds: dto.addonIds ?? [],
			quantity: dto.quantity,
			specialInstructions: dto.specialInstructions ?? null,
			unitPrice,
			itemAddons,
		});

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

export default AddCartItemUseCase;
