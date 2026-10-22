import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
	MenuItemCatalogApiResponse,
	RemoteMenuItemDto,
} from "@application/ports/external/menu-item-catalog.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { RESTAURANT_SERVICE_ENDPOINTS } from "@common/constants/routes.constants.ts";
import { SERVICES } from "@common/constants/services.constants.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/logger/pino.ts";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";
import { getS2SInternalHeaders } from "./s2s-headers.ts";

@injectable()
export class MenuItemCatalogClient implements IMenuItemCatalogPort {
	private readonly baseUrl: string = env.RESTAURANT_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.RESTAURANT_SERVICE_TIMEOUT_MS;

	public async getItemDetails(
		restaurantId: string,
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
	): Promise<CatalogItemDetails | null> {
		const endpoint = RESTAURANT_SERVICE_ENDPOINTS.INTERNAL_MENU_ITEM(
			restaurantId,
			menuItemId,
		);
		const url = `${this.baseUrl}${endpoint}`;

		try {
			const response = await axios.get<
				MenuItemCatalogApiResponse<RemoteMenuItemDto>
			>(url, {
				headers: getS2SInternalHeaders(
					SERVICES.RESTAURANT_SERVICE,
					this.s2sPrivateKey,
					this.s2sServiceName,
				),
				timeout: this.requestTimeoutMs,
			});

			const body = response.data;
			const item = body?.data;
			if (!item) {
				return null;
			}

			const rawItemId = item.menuItemId ?? item.id;
			if (!rawItemId) {
				return null;
			}

			const variant = variantId
				? item.variants?.find((v) => (v.variantId ?? v.id) === variantId)
				: undefined;

			const addons = (item.addons ?? [])
				.filter((a) => {
					const aId = a.addonId ?? a.id;
					return Boolean(aId && (addonIds ?? []).includes(aId));
				})
				.map((a) => ({
					addonId: (a.addonId ?? a.id) as string,
					name: a.name,
					price: Number(a.price),
					isAvailable: a.isAvailable !== false,
				}));

			return {
				menuItemId: rawItemId,
				name: item.name,
				price: Number(item.price),
				isAvailable: item.isAvailable !== false,
				variant: variant
					? {
							variantId: (variant.variantId ?? variant.id) as string,
							name: variant.name,
							price: Number(variant.price),
							isAvailable: variant.isAvailable !== false,
						}
					: null,
				addons,
			};
		} catch (error) {
			if (isAxiosError(error) && error.response) {
				if (error.response.status === HTTP_STATUS.NOT_FOUND) {
					return null;
				}
				logger.error(
					{
						status: error.response.status,
						restaurantId,
						menuItemId,
						data: error.response.data,
					},
					"Restaurant catalog service returned non-OK response",
				);
				throw new Error(
					"Downstream restaurant catalog service is currently unavailable",
				);
			}

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
