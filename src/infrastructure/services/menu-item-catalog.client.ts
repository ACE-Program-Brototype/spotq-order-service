import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
	MenuItemCatalogApiResponse,
	RemoteAddonDTO,
	RemoteMenuItemDTO,
	RemoteVariantDTO,
} from "@application/ports/external/menu-item-catalog.port.ts";
import env from "@config/env.ts";
import logger from "@infrastructure/observability/logger.ts";
import { createServiceCircuitBreaker } from "@infrastructure/services/circuit-breaker.factory.ts";
import { HTTP_STATUS } from "@shared/constants/http.constants.ts";
import { RESTAURANT_SERVICE_ENDPOINTS } from "@shared/constants/routes.constants.ts";
import { SERVICES } from "@shared/constants/services.constants.ts";
import {
	DownstreamServiceTimeoutError,
	DownstreamServiceUnavailableError,
} from "@shared/errors/index.ts";
import {
	type CircuitBreaker,
	CircuitBreakerOpenError,
	CircuitBreakerTimeoutError,
} from "@spotq-org/circuit-breaker";
import axios, { isAxiosError } from "axios";
import { injectable } from "inversify";
import { getS2SInternalHeaders } from "./s2s-headers.ts";

@injectable()
export class MenuItemCatalogClient implements IMenuItemCatalogPort {
	private readonly baseUrl: string = env.RESTAURANT_SERVICE_URL;
	private readonly s2sServiceName: string = env.S2S_SERVICE_NAME;
	private readonly s2sPrivateKey: string = env.ORDER_S2S_PRIVATE_KEY;
	private readonly requestTimeoutMs: number = env.RESTAURANT_SERVICE_TIMEOUT_MS;
	private readonly breaker: CircuitBreaker<
		[string, string, (string | null | undefined)?, string[]?],
		CatalogItemDetails | null
	>;

	constructor() {
		this.breaker = createServiceCircuitBreaker<
			[string, string, (string | null | undefined)?, string[]?],
			CatalogItemDetails | null
		>(
			(restaurantId, menuItemId, variantId, addonIds) =>
				this.fetchItemDetails(restaurantId, menuItemId, variantId, addonIds),
			{
				name: "restaurant-catalog",
				serviceName: SERVICES.RESTAURANT_SERVICE,
				endpointTag:
					"GET /api/internal/v1/restaurants/:id/menu-items/:itemId/internal",
				timeoutMs: this.requestTimeoutMs,
				checkIsFailure: (error: unknown) => {
					if (isAxiosError(error) && error.response) {
						const status = error.response.status;
						// HTTP 404 (Item not found) or other 4xx errors do not count toward circuit failure
						if (status < 500) {
							return false;
						}
					}
					return true;
				},
			},
		);
	}

	public async getItemDetails(
		restaurantId: string,
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
	): Promise<CatalogItemDetails | null> {
		try {
			return await this.breaker.execute(
				restaurantId,
				menuItemId,
				variantId,
				addonIds,
			);
		} catch (error) {
			if (error instanceof CircuitBreakerOpenError) {
				logger.warn(
					{
						restaurantId,
						menuItemId,
						breaker: this.breaker.name,
						service: SERVICES.RESTAURANT_SERVICE,
					},
					"Circuit breaker is OPEN. Fast-failing getItemDetails request.",
				);
				throw new DownstreamServiceUnavailableError(
					SERVICES.RESTAURANT_SERVICE,
					"Downstream restaurant catalog service is currently unavailable",
				);
			}

			if (error instanceof CircuitBreakerTimeoutError) {
				logger.warn(
					{
						restaurantId,
						menuItemId,
						breaker: this.breaker.name,
						service: SERVICES.RESTAURANT_SERVICE,
					},
					"Circuit breaker timed out for getItemDetails request.",
				);
				throw new DownstreamServiceTimeoutError(
					SERVICES.RESTAURANT_SERVICE,
					"Downstream restaurant catalog service timed out",
				);
			}

			throw error;
		}
	}

	private async fetchItemDetails(
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
				MenuItemCatalogApiResponse<RemoteMenuItemDTO>
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
				? item.variants?.find(
						(v: RemoteVariantDTO) => (v.variantId ?? v.id) === variantId,
					)
				: undefined;

			const addons = (item.addons ?? [])
				.filter((a: RemoteAddonDTO) => {
					const aId = a.addonId ?? a.id;
					return Boolean(aId && (addonIds ?? []).includes(aId));
				})
				.map((a: RemoteAddonDTO) => ({
					addonId: (a.addonId ?? a.id) as string,
					name: a.name,
					price: Number(a.price),
					isAvailable: a.isAvailable !== false,
				}));

			return {
				menuItemId: rawItemId,
				name: item.name,
				price: Number(item.price),
				preparationTime: item.preparationTime ?? null,
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
				throw new DownstreamServiceUnavailableError(
					SERVICES.RESTAURANT_SERVICE,
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

	public shutdown(): void {
		this.breaker.shutdown();
	}
}
