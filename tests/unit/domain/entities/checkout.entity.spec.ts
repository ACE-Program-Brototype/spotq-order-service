import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	CheckoutDetails,
	CheckoutItem,
} from "@domain/entities/checkout.entity.ts";
import { CartEmptyError } from "@domain/errors/cart.errors.ts";
import { InvalidTaxPercentError } from "@domain/errors/order.errors.ts";

describe("Checkout Domain Entity", () => {
	it("should calculate line total for CheckoutItem correctly with addons and quantity", () => {
		const item = new CheckoutItem({
			cartItemId: "item-1",
			menuItemId: "menu-1",
			name: "Cheese Burger",
			variantId: "v-1",
			variantName: "Large",
			quantity: 2,
			unitPrice: 150,
			addons: [
				{ addonId: "a-1", name: "Extra Cheese", price: 30 },
				{ addonId: "a-2", name: "Bacon", price: 40 },
			],
		});

		// (150 + 30 + 40) * 2 = 220 * 2 = 440
		assert.equal(item.lineTotal, 440);
		assert.equal(item.addons.length, 2);
	});

	it("should create CheckoutDetails and calculate subtotal, taxAmount, and totalAmount correctly", () => {
		const checkout = new CheckoutDetails({
			cartId: "cart-123",
			restaurantId: "rest-456",
			restaurantName: "Burger Spot",
			taxPercent: 5,
			items: [
				{
					cartItemId: "item-1",
					menuItemId: "menu-1",
					name: "Burger",
					quantity: 2,
					unitPrice: 100,
					addons: [],
				},
				{
					cartItemId: "item-2",
					menuItemId: "menu-2",
					name: "Fries",
					quantity: 1,
					unitPrice: 50,
					addons: [{ addonId: "a-1", name: "Dip", price: 10 }],
				},
			],
		});

		// Item 1: 100 * 2 = 200
		// Item 2: (50 + 10) * 1 = 60
		// Subtotal: 260
		// Tax (5%): 260 * 0.05 = 13.00
		// Total: 273.00
		assert.equal(checkout.cartId, "cart-123");
		assert.equal(checkout.restaurantId, "rest-456");
		assert.equal(checkout.restaurantName, "Burger Spot");
		assert.equal(checkout.itemCount, 3);
		assert.equal(checkout.subtotal, 260);
		assert.equal(checkout.taxPercent, 5);
		assert.equal(checkout.taxAmount, 13);
		assert.equal(checkout.totalAmount, 273);
	});

	it("should throw CartEmptyError when items array is empty", () => {
		assert.throws(
			() =>
				new CheckoutDetails({
					cartId: "cart-123",
					restaurantId: "rest-456",
					restaurantName: "Burger Spot",
					taxPercent: 5,
					items: [],
				}),
			(err: unknown) => {
				assert.ok(err instanceof CartEmptyError);
				return true;
			},
		);
	});

	it("should throw InvalidTaxPercentError when tax percent is negative", () => {
		assert.throws(
			() =>
				new CheckoutDetails({
					cartId: "cart-123",
					restaurantId: "rest-456",
					restaurantName: "Burger Spot",
					taxPercent: -5,
					items: [
						{
							cartItemId: "item-1",
							menuItemId: "menu-1",
							name: "Burger",
							quantity: 1,
							unitPrice: 100,
						},
					],
				}),
			(err: unknown) => {
				assert.ok(err instanceof InvalidTaxPercentError);
				return true;
			},
		);
	});

	it("should correctly round floating point tax and total amounts", () => {
		const checkout = new CheckoutDetails({
			cartId: "cart-123",
			restaurantId: "rest-456",
			restaurantName: "Burger Spot",
			taxPercent: 5,
			items: [
				{
					cartItemId: "item-1",
					menuItemId: "menu-1",
					name: "Burger",
					quantity: 1,
					unitPrice: 99.99,
				},
			],
		});

		// Subtotal: 99.99
		// Tax: 99.99 * 0.05 = 4.9995 -> 5.00
		// Total: 99.99 + 5.00 = 104.99
		assert.equal(checkout.subtotal, 99.99);
		assert.equal(checkout.taxAmount, 5);
		assert.equal(checkout.totalAmount, 104.99);
	});
});
