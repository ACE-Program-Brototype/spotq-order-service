export interface RemoteAddonDTO {
	addonId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

export interface RemoteVariantDTO {
	variantId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

export interface RemoteMenuItemDTO {
	menuItemId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
	variants?: RemoteVariantDTO[];
	addons?: RemoteAddonDTO[];
}

export interface MenuItemCatalogApiResponse<T> {
	success: boolean;
	data: T;
}
