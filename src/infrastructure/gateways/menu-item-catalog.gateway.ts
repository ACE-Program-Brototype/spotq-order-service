import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/gateways/menu-item-catalog.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { RESTAURANT_SERVICE_ENDPOINTS } from "@common/constants/routes.constants.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/logger/pino.ts";
import { injectable } from "inversify";

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
			const endpoint = RESTAURANT_SERVICE_ENDPOINTS.CUSTOMER_MENU_ITEM(
				restaurantId,
				menuItemId,
			);
			const url = `${this.baseUrl}${endpoint}`;
			const response = await fetch(url, {
				headers: { Accept: "application/json" },
			});

			if (response.status === HttpStatus.NOT_FOUND) {
				return null;
			}

			if (!response.ok) {
				logger.warn(
					{ status: response.status, restaurantId, menuItemId },
					"Restaurant catalog service returned non-OK response",
				);
				return null;
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
		}

		if (
			process.env.NODE_ENV !== "test" &&
			env.NODE_ENV !== "production" &&
			menuItemId === "3f2a1b00-55de-4d39-a9a7-9f6b986e8123"
		) {
			logger.warn(
				{ restaurantId, menuItemId },
				"Restaurant catalog service unavailable; using local development test fixture",
			);
			return {
				menuItemId,
				name: "Classic Margherita Pizza",
				price: 249,
				isAvailable: true,
				variant: variantId
					? {
							variantId,
							name: "Medium",
							price: 249,
							isAvailable: true,
						}
					: null,
				addons: (addonIds ?? []).map((id) => ({
					addonId: id,
					name: "Extra Cheese",
					price: 40,
					isAvailable: true,
				})),
			};
		}

		return null;
	}
}

export default MenuItemCatalogGateway;
