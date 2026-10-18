import type {
	AddCartItemRequestDto,
	AddCartItemResponseDto,
} from "@application/dtos/add-cart-item.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { InvalidCartQuantityError } from "@domain/errors/invalid-cart-quantity.error.ts";
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
		let cart = await this.cartRepository.findById(dto.cartId);

		if (cart) {
			cart.validateAccess(dto.authenticatedUserId);

			if (cart.isExpired()) {
				if (cart.status !== CartStatus.EXPIRED) {
					await this.cartRepository.update(cart.id, {
						status: CartStatus.EXPIRED,
					});
				}
				throw new CartExpiredError();
			}

			if (cart.items.length > 0) {
				cart.validateRestaurant(dto.restaurantId);
			}

			const matchingItem = cart.findMatchingItem(
				dto.menuItemId,
				dto.variantId,
				dto.addonIds,
				dto.specialInstructions,
			);
			if (matchingItem && matchingItem.quantity + dto.quantity > 20) {
				throw new InvalidCartQuantityError();
			}
		} else {
			const activeCart = await this.cartRepository.findActiveByUserId(
				dto.authenticatedUserId,
			);

			if (
				activeCart &&
				activeCart.items.length > 0 &&
				activeCart.restaurantId !== dto.restaurantId
			) {
				throw new DifferentRestaurantCartError();
			}

			if (activeCart && activeCart.restaurantId === dto.restaurantId) {
				cart = activeCart;
			}
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
			cartId: cart ? cart.id : dto.cartId,
			userId: dto.authenticatedUserId,
			restaurantId: dto.restaurantId,
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

		return CartResponseMapper.toMutationDto(updatedCart);
	}
}

export default AddCartItemUseCase;
