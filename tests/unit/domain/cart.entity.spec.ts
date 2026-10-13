import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";

describe("Cart Domain Entities", () => {
	it("should calculate correct line item total with base price, addons, and quantity", () => {
		const addon = new CartItemAddon({
			id: "addon-1",
			cartItemId: "item-1",
			addonId: "adn-1",
			addonName: "Extra Mozzarella",
			price: 20,
		});

		const item = new CartItem({
			id: "item-1",
			cartId: "cart-1",
			menuItemId: "menu-1",
			menuItemName: "Margherita Pizza",
			variantId: "var-1",
			variantName: "Medium",
			quantity: 2,
			unitPrice: 249,
			specialInstructions: "Crispy crust",
			addons: [addon],
		});

		assert.equal(item.calculateLineTotal(), 518);
	});

	it("should calculate correct cart subtotal and total item count", () => {
		const item1 = new CartItem({
			id: "item-1",
			cartId: "cart-1",
			menuItemId: "menu-1",
			menuItemName: "Margherita Pizza",
			quantity: 2,
			unitPrice: 200,
			addons: [
				{
					id: "addon-1",
					cartItemId: "item-1",
					addonId: "adn-1",
					price: 25,
				},
			],
		});

		const item2 = new CartItem({
			id: "item-2",
			cartId: "cart-1",
			menuItemId: "menu-2",
			menuItemName: "Garlic Bread",
			quantity: 1,
			unitPrice: 120,
			addons: [],
		});

		const cart = new Cart({
			id: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 3600000),
			items: [item1, item2],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		assert.equal(cart.calculateItemCount(), 3);
		assert.equal(cart.calculateSubtotal(), 545);
	});

	it("should identify expired cart based on timestamp or status", () => {
		const activeCart = new Cart({
			id: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 3600000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		assert.equal(activeCart.isExpired(), false);

		const expiredByTimeCart = new Cart({
			id: "cart-2",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 1000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		assert.equal(expiredByTimeCart.isExpired(), true);

		const expiredByStatusCart = new Cart({
			id: "cart-3",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.EXPIRED,
			expiresAt: new Date(Date.now() + 3600000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		assert.equal(expiredByStatusCart.isExpired(), true);
	});
});
