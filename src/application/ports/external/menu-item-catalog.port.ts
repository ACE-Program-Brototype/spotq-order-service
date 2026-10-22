export type {
	MenuItemCatalogApiResponse,
	RemoteAddonDto,
	RemoteMenuItemDto,
	RemoteVariantDto,
} from "@application/dtos/external/menu-item-catalog.dto.ts";

export interface CatalogAddonDetails {
	addonId: string;
	name: string;
	price: number;
	isAvailable: boolean;
}

export interface CatalogVariantDetails {
	variantId: string;
	name: string;
	price: number;
	isAvailable: boolean;
}

export interface CatalogItemDetails {
	menuItemId: string;
	name: string;
	price: number;
	isAvailable: boolean;
	variant?: CatalogVariantDetails | null;
	addons: CatalogAddonDetails[];
}

export interface IMenuItemCatalogPort {
	getItemDetails(
		restaurantId: string,
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
	): Promise<CatalogItemDetails | null>;
}
