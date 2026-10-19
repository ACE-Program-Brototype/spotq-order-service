import type { CatalogItemDetails } from "@application/ports/external/menu-item-catalog.port.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";

export function validateCatalogItemAvailability(
	catalogItem: CatalogItemDetails | null,
	variantId?: string | null,
	addonIds?: string[],
): asserts catalogItem is CatalogItemDetails {
	if (!catalogItem) {
		throw new MenuItemNotFoundError();
	}

	if (!catalogItem.isAvailable) {
		throw new ItemUnavailableError();
	}

	if (variantId) {
		if (!catalogItem.variant) {
			throw new MenuItemNotFoundError();
		}
		if (!catalogItem.variant.isAvailable) {
			throw new ItemUnavailableError();
		}
	}

	if (addonIds && addonIds.length > 0) {
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
