import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MenuItemCatalogClient } from "@infrastructure/services/menu-item-catalog.client.ts";
import axios, {
	AxiosError,
	type AxiosRequestConfig,
	type AxiosResponse,
	type InternalAxiosRequestConfig,
} from "axios";

describe("MenuItemCatalogClient", () => {
	const restaurantId = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const menuItemId = "3f2a1b00-55de-4d39-a9a7-9f6b986e8123";
	const variantId = "9a8b7c6d-1111-4222-b333-c44455566677";
	const addonId = "77aa88bb-99cc-4dde-aff0-1234567890ab";

	it("should parse and return item details when restaurant service returns 200 OK", async () => {
		const originalGet = axios.get;
		axios.get = (async () =>
			({
				status: 200,
				statusText: "OK",
				headers: {},
				config: {} as unknown as InternalAxiosRequestConfig,
				data: {
					success: true,
					data: {
						id: menuItemId,
						name: "Classic Margherita Pizza",
						price: 249,
						isAvailable: true,
						variants: [
							{
								id: variantId,
								name: "Medium",
								price: 249,
								isAvailable: true,
							},
						],
						addons: [
							{
								id: "row-1",
								addonId,
								name: "Extra Cheese",
								price: 40,
								isAvailable: true,
							},
						],
					},
				},
			}) as unknown as AxiosResponse) as unknown as typeof axios.get;

		try {
			const gateway = new MenuItemCatalogClient();
			const result = await gateway.getItemDetails(
				restaurantId,
				menuItemId,
				variantId,
				[addonId],
			);

			assert.notEqual(result, null);
			assert.equal(result?.menuItemId, menuItemId);
			assert.equal(result?.name, "Classic Margherita Pizza");
			assert.equal(result?.variant?.variantId, variantId);
			assert.equal(result?.addons.length, 1);
			assert.equal(result?.addons[0]?.addonId, addonId);
		} finally {
			axios.get = originalGet;
		}
	});

	it("should parse and return item details when response uses contextual IDs (menuItemId, variantId, addonId)", async () => {
		const originalGet = axios.get;
		axios.get = (async () =>
			({
				status: 200,
				statusText: "OK",
				headers: {},
				config: {} as unknown as InternalAxiosRequestConfig,
				data: {
					success: true,
					data: {
						menuItemId,
						name: "Classic Margherita Pizza",
						price: 249,
						isAvailable: true,
						variants: [
							{
								variantId,
								name: "Medium",
								price: 249,
								isAvailable: true,
							},
						],
						addons: [
							{
								addonId,
								name: "Extra Cheese",
								price: 40,
								isAvailable: true,
							},
						],
					},
				},
			}) as unknown as AxiosResponse) as unknown as typeof axios.get;

		try {
			const gateway = new MenuItemCatalogClient();
			const result = await gateway.getItemDetails(
				restaurantId,
				menuItemId,
				variantId,
				[addonId],
			);

			assert.notEqual(result, null);
			assert.equal(result?.menuItemId, menuItemId);
			assert.equal(result?.variant?.variantId, variantId);
			assert.equal(result?.addons.length, 1);
			assert.equal(result?.addons[0]?.addonId, addonId);
		} finally {
			axios.get = originalGet;
		}
	});

	it("should return null when restaurant service returns 404 Not Found", async () => {
		const originalGet = axios.get;
		const notFoundError = new AxiosError(
			"Request failed with status code 404",
			"ERR_BAD_REQUEST",
			{} as unknown as InternalAxiosRequestConfig,
			undefined,
			{
				status: 404,
				statusText: "Not Found",
				headers: {},
				config: {} as unknown as InternalAxiosRequestConfig,
				data: { message: "Item not found" },
			},
		);
		axios.get = (async () => {
			throw notFoundError;
		}) as unknown as typeof axios.get;

		try {
			const gateway = new MenuItemCatalogClient();
			const result = await gateway.getItemDetails(
				restaurantId,
				menuItemId,
				variantId,
			);
			assert.equal(result, null);
		} finally {
			axios.get = originalGet;
		}
	});

	it("should throw error when network request fails", async () => {
		const originalGet = axios.get;
		axios.get = (async () => {
			throw new Error("Connection refused");
		}) as unknown as typeof axios.get;

		try {
			const gateway = new MenuItemCatalogClient();
			await assert.rejects(
				async () => {
					await gateway.getItemDetails(restaurantId, menuItemId, variantId);
				},
				{ message: "Connection refused" },
			);
		} finally {
			axios.get = originalGet;
		}
	});

	it("should include x-caller-service header in outgoing request", async () => {
		let capturedConfig: AxiosRequestConfig | undefined;
		const originalGet = axios.get;
		axios.get = (async (_url: string, config?: AxiosRequestConfig) => {
			capturedConfig = config;
			return {
				status: 200,
				statusText: "OK",
				headers: {},
				config: {} as unknown as InternalAxiosRequestConfig,
				data: {
					success: true,
					data: {
						id: menuItemId,
						name: "Classic Margherita Pizza",
						price: 249,
						isAvailable: true,
					},
				},
			};
		}) as unknown as typeof axios.get;

		try {
			const gateway = new MenuItemCatalogClient();
			await gateway.getItemDetails(restaurantId, menuItemId, variantId);
			assert.equal(
				(capturedConfig?.headers as Record<string, string> | undefined)?.[
					"x-caller-service"
				],
				"order-service",
			);
		} finally {
			axios.get = originalGet;
		}
	});
});
