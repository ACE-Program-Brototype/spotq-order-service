import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MenuItemCatalogClient } from "@infrastructure/external/menu-item-catalog.client.ts";

describe("MenuItemCatalogClient", () => {
	const restaurantId = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const menuItemId = "3f2a1b00-55de-4d39-a9a7-9f6b986e8123";
	const variantId = "9a8b7c6d-1111-4222-b333-c44455566677";
	const addonId = "77aa88bb-99cc-4dde-aff0-1234567890ab";

	it("should parse and return item details when restaurant service returns 200 OK", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () =>
			({
				status: 200,
				ok: true,
				json: async () => ({
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
				}),
			}) as unknown as Response;

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
			globalThis.fetch = originalFetch;
		}
	});

	it("should return null when restaurant service returns 404 Not Found", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () =>
			({
				status: 404,
				ok: false,
			}) as unknown as Response;

		try {
			const gateway = new MenuItemCatalogClient();
			const result = await gateway.getItemDetails(
				restaurantId,
				menuItemId,
				variantId,
			);
			assert.equal(result, null);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("should throw error when network request fails", async () => {
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async () => {
			throw new Error("Connection refused");
		};

		try {
			const gateway = new MenuItemCatalogClient();
			await assert.rejects(
				async () => {
					await gateway.getItemDetails(restaurantId, menuItemId, variantId);
				},
				{ message: "Connection refused" },
			);
		} finally {
			globalThis.fetch = originalFetch;
		}
	});

	it("should include x-caller-service header in outgoing request", async () => {
		let capturedHeaders: Record<string, string> | undefined;
		const originalFetch = globalThis.fetch;
		globalThis.fetch = async (
			_url: string | URL | Request,
			init?: RequestInit,
		) => {
			capturedHeaders = init?.headers as Record<string, string>;
			return {
				status: 404,
				ok: false,
			} as unknown as Response;
		};

		try {
			const gateway = new MenuItemCatalogClient();
			await gateway.getItemDetails(restaurantId, menuItemId, variantId);
			assert.equal(capturedHeaders?.["x-caller-service"], "order-service");
		} finally {
			globalThis.fetch = originalFetch;
		}
	});
});
