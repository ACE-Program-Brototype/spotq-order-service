export interface RemoteAddonDto {
	addonId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

export interface RemoteVariantDto {
	variantId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

export interface RemoteMenuItemDto {
	menuItemId?: string;
	id?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
	variants?: RemoteVariantDto[];
	addons?: RemoteAddonDto[];
}

export interface MenuItemCatalogApiResponse<T> {
	success: boolean;
	data: T;
}
