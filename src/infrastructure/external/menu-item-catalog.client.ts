import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { RESTAURANT_SERVICE_ENDPOINTS } from "@common/constants/routes.constants.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/logger/pino.ts";
import { injectable } from "inversify";
import { getS2SInternalHeaders } from "./s2s-headers.ts";

interface ApiResponse<T> {
	success: boolean;
	data: T;
}

interface RemoteVariant {
	id: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

interface RemoteAddon {
	id: string;
	addonId?: string;
	name: string;
	price: number;
	isAvailable?: boolean;
}

interface RemoteMenuItem {
	id: string;
	name: string;
	price: number;
	isAvailable?: boolean;
	variants?: RemoteVariant[];
	addons?: RemoteAddon[];
}

@injectable()
export class MenuItemCatalogGateway implements IMenuItemCatalogPort {
	private readonly baseUrl: string;

	constructor() {
		this.baseUrl = env.RESTAURANT_SERVICE_URL;
	}

	public async getItemDetails(
		restaurantId: string,
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
	): Promise<CatalogItemDetails | null> {
		try {
			const endpoint = RESTAURANT_SERVICE_ENDPOINTS.INTERNAL_MENU_ITEM(
				restaurantId,
				menuItemId,
			);
			const url = `${this.baseUrl}${endpoint}`;
			const response = await fetch(url, {
				headers: getS2SInternalHeaders(
					env.S2S_RESTAURANT_AUDIENCE,
					env.S2S_PRIVATE_KEY,
					env.SERVICE_NAME,
				),
			});

			if (response.status === HttpStatus.NOT_FOUND) {
				return null;
			}

			if (!response.ok) {
				logger.error(
					{ status: response.status, restaurantId, menuItemId },
					"Restaurant catalog service returned non-OK response",
				);
				throw new Error(
					"Downstream restaurant catalog service is currently unavailable",
				);
			}

			const body = (await response.json()) as ApiResponse<RemoteMenuItem>;
			const item = body.data;
			if (!item) {
				return null;
			}

			const variant = variantId
				? item.variants?.find((v) => v.id === variantId)
				: undefined;

			const addons = (item.addons ?? [])
				.filter((a) => {
					const aId = a.addonId ?? a.id;
					return (addonIds ?? []).includes(aId);
				})
				.map((a) => ({
					addonId: a.addonId ?? a.id,
					name: a.name,
					price: Number(a.price),
					isAvailable: a.isAvailable !== false,
				}));

			return {
				menuItemId: item.id,
				name: item.name,
				price: Number(item.price),
				isAvailable: item.isAvailable !== false,
				variant: variant
					? {
							variantId: variant.id,
							name: variant.name,
							price: Number(variant.price),
							isAvailable: variant.isAvailable !== false,
						}
					: null,
				addons,
			};
		} catch (error) {
			logger.error(
				{ error, restaurantId, menuItemId },
				"Failed to fetch menu item details from restaurant catalog service",
			);
			throw error instanceof Error
				? error
				: new Error("Failed to communicate with restaurant catalog service");
		}
	}
}

export { MenuItemCatalogGateway as MenuItemCatalogClient };
export default MenuItemCatalogGateway;
