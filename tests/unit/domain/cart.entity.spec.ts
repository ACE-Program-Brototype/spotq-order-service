import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";

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

		assert.equal(item.calculateLineTotal(), 538);
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
		assert.equal(cart.calculateSubtotal(), 570);
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

	it("should enforce domain validation rules on access, active state, and restaurant", () => {
		const cart = new Cart({
			id: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 3600000),
			items: [],
		});

		// Success calls
		assert.doesNotThrow(() => cart.validateAccess("user-1"));
		assert.doesNotThrow(() => cart.validateActive());
		assert.doesNotThrow(() => cart.validateRestaurant("rest-1"));

		// Failing calls
		assert.throws(
			() => cart.validateAccess("wrong-user"),
			ForbiddenCartAccessError,
		);
		// Empty cart can switch restaurants without error
		assert.doesNotThrow(() => cart.validateRestaurant("other-rest"));

		// Cart with items must throw DifferentRestaurantCartError on restaurant mismatch
		const cartWithItems = new Cart({
			id: "cart-with-items",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 3600000),
			items: [
				new CartItem({
					id: "item-1",
					cartId: "cart-with-items",
					menuItemId: "menu-1",
					quantity: 1,
					unitPrice: 100,
					totalPrice: 100,
					addons: [],
				}),
			],
		});
		assert.throws(
			() => cartWithItems.validateRestaurant("other-rest"),
			DifferentRestaurantCartError,
		);

		const expiredCart = new Cart({
			id: "cart-2",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.EXPIRED,
			expiresAt: new Date(Date.now() - 1000),
			items: [],
		});
		assert.throws(() => expiredCart.validateActive(), CartExpiredError);
	});

	it("should find matching item using domain method", () => {
		const item = new CartItem({
			id: "item-1",
			cartId: "cart-1",
			menuItemId: "menu-1",
			variantId: "var-1",
			quantity: 1,
			unitPrice: 100,
			specialInstructions: "No onions",
			addons: [
				{ id: "adn-row", cartItemId: "item-1", addonId: "adn-1", price: 10 },
			],
		});

		const cart = new Cart({
			id: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 3600000),
			items: [item],
		});

		const match = cart.findMatchingItem(
			"menu-1",
			"var-1",
			["adn-1"],
			"No onions",
		);
		assert.ok(match);
		assert.equal(match.id, "item-1");

		const noMatch = cart.findMatchingItem(
			"menu-1",
			"var-2",
			["adn-1"],
			"No onions",
		);
		assert.equal(noMatch, undefined);
	});
});
