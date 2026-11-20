import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";

describe("CartItem matchesConfiguration", () => {
	const baseItem = new CartItem({
		id: "item-1",
		cartId: "cart-1",
		menuItemId: "menu-1",
		variantId: "var-1",
		quantity: 1,
		specialInstructions: "Less spicy",
		addons: [
			new CartItemAddon({
				id: "addon-row-1",
				cartItemId: "item-1",
				addonId: "addon-1",
				price: 20,
			}),
			new CartItemAddon({
				id: "addon-row-2",
				cartItemId: "item-1",
				addonId: "addon-2",
				price: 30,
			}),
		],
	});

	it("should return true when all fields and addons match regardless of addon order", () => {
		const matches = baseItem.matchesConfiguration(
			"menu-1",
			"var-1",
			["addon-2", "addon-1"],
			"Less spicy",
		);
		assert.equal(matches, true);
	});

	it("should return false when menuItemId differs", () => {
		const matches = baseItem.matchesConfiguration(
			"menu-2",
			"var-1",
			["addon-1", "addon-2"],
			"Less spicy",
		);
		assert.equal(matches, false);
	});

	it("should return false when variantId differs", () => {
		const matches = baseItem.matchesConfiguration(
			"menu-1",
			"var-2",
			["addon-1", "addon-2"],
			"Less spicy",
		);
		assert.equal(matches, false);
	});

	it("should return false when specialInstructions differ", () => {
		const matches = baseItem.matchesConfiguration(
			"menu-1",
			"var-1",
			["addon-1", "addon-2"],
			"Extra spicy",
		);
		assert.equal(matches, false);
	});

	it("should return false when addons differ", () => {
		const matches = baseItem.matchesConfiguration(
			"menu-1",
			"var-1",
			["addon-1"],
			"Less spicy",
		);
		assert.equal(matches, false);
	});
});
