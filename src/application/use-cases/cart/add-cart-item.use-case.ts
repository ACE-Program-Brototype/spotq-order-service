import type {
	AddCartItemRequestDTO,
	AddCartItemResponseDTO,
} from "@application/dtos/cart/add-cart-item.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart/cart-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { TYPES } from "@config/di/types.ts";
import { CART_LIMITS } from "@domain/constants/cart.constants.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import {
	CartExpiredError,
	DifferentRestaurantCartError,
	InvalidCartQuantityError,
} from "@domain/errors/cart.errors.ts";
import type { ICartRepository } from "@domain/repositories/i-cart.repository.ts";
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
		dto: AddCartItemRequestDTO,
	): Promise<AddCartItemResponseDTO> {
		let cart = dto.cartId
			? await this.cartRepository.findById(dto.cartId)
			: null;

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

			cart.validateRestaurant(dto.restaurantId);

			const matchingItem = cart.findMatchingItem(
				dto.menuItemId,
				dto.variantId,
				dto.addonIds,
				dto.specialInstructions,
			);
			if (
				matchingItem &&
				matchingItem.quantity + dto.quantity > CART_LIMITS.MAX_QUANTITY
			) {
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

		validateCatalogItemAvailability(catalogItem, dto.variantId, dto.addonIds);

		const unitPrice = catalogItem.variant?.price ?? catalogItem.price;
		const itemAddons = (catalogItem.addons ?? []).map((a) => ({
			addonId: a.addonId,
			name: a.name,
			price: a.price,
		}));

		const updatedCart = await this.cartRepository.addItem({
			cartId: cart ? cart.id : (dto.cartId as string),
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

		return CartResponseMapper.toMutationDTO(updatedCart);
	}
}
