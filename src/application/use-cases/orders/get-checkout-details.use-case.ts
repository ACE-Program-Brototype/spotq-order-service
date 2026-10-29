import type {
	CheckoutDetailsResponseDto,
	GetCheckoutDetailsInputDto,
} from "@application/dtos/orders/checkout-details.dto.ts";
import { CheckoutResponseMapper } from "@application/mappers/checkout-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IGetCheckoutDetailsUseCase } from "@application/ports/use-cases/orders/get-checkout-details.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { ORDER_DEFAULTS } from "@common/constants/message.constants.ts";
import { TYPES } from "@config/di/types.ts";
import env from "@config/env.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import { CheckoutDetails } from "@domain/entities/checkout.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetCheckoutDetailsUseCase implements IGetCheckoutDetailsUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
		@inject(TYPES.RestaurantServiceClient)
		private readonly restaurantServiceClient: IRestaurantServiceClient,
		@inject(TYPES.MenuItemCatalogPort)
		private readonly catalogPort: IMenuItemCatalogPort,
	) {}

	public async execute(
		dto: GetCheckoutDetailsInputDto,
	): Promise<CheckoutDetailsResponseDto> {
		let cart: Cart | null = null;
		if (dto.cartId) {
			cart = await this.cartRepository.findById(dto.cartId);
		} else {
			cart = await this.cartRepository.findActiveByUserId(
				dto.userId,
				dto.restaurantId,
			);
		}

		if (!cart) {
			throw new CartNotFoundError();
		}

		cart.validateAccess(dto.userId);

		if (dto.restaurantId) {
			cart.validateRestaurant(dto.restaurantId);
		}

		if (cart.isExpired()) {
			if (cart.status !== CartStatus.EXPIRED) {
				await this.cartRepository.update(cart.id, {
					status: CartStatus.EXPIRED,
				});
			}
			throw new CartExpiredError();
		}

		if (!cart.items || cart.items.length === 0) {
			throw new CartEmptyError();
		}

		const restaurantValidation =
			await this.restaurantServiceClient.validateRestaurant(cart.restaurantId);

		const checkoutItems = await Promise.all(
			cart.items.map(async (cartItem) => {
				const addonIds = cartItem.addons.map((a) => a.addonId);
				const catalogItem = await this.catalogPort.getItemDetails(
					cart.restaurantId,
					cartItem.menuItemId,
					cartItem.variantId,
					addonIds,
				);

				validateCatalogItemAvailability(
					catalogItem,
					cartItem.variantId,
					addonIds,
				);

				const unitPrice =
					catalogItem.variant?.price ?? catalogItem.price ?? cartItem.unitPrice;
				const itemName =
					catalogItem.name ?? cartItem.menuItemName ?? ORDER_DEFAULTS.ITEM_NAME;
				const variantName =
					catalogItem.variant?.name ?? cartItem.variantName ?? null;
				const catalogAddonsMap = new Map(
					catalogItem.addons.map((a) => [a.addonId, a]),
				);

				const addons = cartItem.addons.map((a) => {
					const catalogAddon = catalogAddonsMap.get(a.addonId);
					return {
						addonId: a.addonId,
						name:
							catalogAddon?.name ?? a.addonName ?? ORDER_DEFAULTS.ADDON_NAME,
						price: catalogAddon?.price ?? a.price,
					};
				});

				return {
					cartItemId: cartItem.id,
					menuItemId: cartItem.menuItemId,
					name: itemName,
					variantId: cartItem.variantId,
					variantName,
					quantity: cartItem.quantity,
					unitPrice,
					specialInstructions: cartItem.specialInstructions,
					addons,
				};
			}),
		);

		const checkoutDetails = new CheckoutDetails({
			cartId: cart.id,
			restaurantId: cart.restaurantId,
			restaurantName: restaurantValidation.restaurantName,
			items: checkoutItems,
			taxPercent: env.TAX_PERCENT,
		});

		return CheckoutResponseMapper.toDto(checkoutDetails);
	}
}
