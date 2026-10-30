import type {
	AddBatchCartItemsDTO,
	AddBatchCartItemsResponseDTO,
} from "@application/dtos/cart/add-batch-cart-items.dto.ts";
import { CartResponseMapper } from "@application/mappers/cart-response.mapper.ts";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IAddBatchCartItemsUseCase } from "@application/ports/use-cases/cart/add-batch-cart-items.use-case.port.ts";
import { validateCatalogItemAvailability } from "@application/utils/catalog-validator.util.ts";
import { TYPES } from "@config/di/types.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import type {
	ICartRepository,
	ReplaceCartBatchItemInput,
} from "@domain/repositories/i-cart.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class AddBatchCartItemsUseCase implements IAddBatchCartItemsUseCase {
	constructor(
		@inject(TYPES.CartRepository)
		private readonly cartRepository: ICartRepository,
		@inject(TYPES.MenuItemCatalogPort)
		private readonly catalogPort: IMenuItemCatalogPort,
	) {}

	public async execute(
		dto: AddBatchCartItemsDTO,
	): Promise<AddBatchCartItemsResponseDTO> {
		const mergedItems = Cart.mergeBatchItems(dto.items);

		const preparedItems: ReplaceCartBatchItemInput[] = await Promise.all(
			mergedItems.map(async (item) => {
				const catalogItem = await this.catalogPort.getItemDetails(
					dto.restaurantId,
					item.menuItemId,
					item.variantId,
					item.addonIds,
				);

				validateCatalogItemAvailability(
					catalogItem,
					item.variantId,
					item.addonIds,
				);

				const unitPrice = catalogItem.variant?.price ?? catalogItem.price;
				const itemAddons = (catalogItem.addons ?? []).map((addon) => ({
					addonId: addon.addonId,
					name: addon.name,
					price: addon.price,
				}));

				return {
					menuItemId: item.menuItemId,
					menuItemName: catalogItem.name,
					variantId: item.variantId,
					variantName: catalogItem.variant?.name ?? null,
					quantity: item.quantity,
					specialInstructions: item.specialInstructions,
					unitPrice,
					totalPrice: CartItem.calculateLineTotal(
						unitPrice,
						itemAddons,
						item.quantity,
					),
					itemAddons,
				};
			}),
		);

		const syncedCart = await this.cartRepository.replaceCartItemsBatch({
			userId: dto.authenticatedUserId,
			restaurantId: dto.restaurantId,
			items: preparedItems,
		});

		return CartResponseMapper.toDTO(syncedCart);
	}
}
