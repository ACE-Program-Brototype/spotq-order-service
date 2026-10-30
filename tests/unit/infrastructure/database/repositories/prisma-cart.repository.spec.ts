import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaCartRepository } from "@infrastructure/database/repositories/prisma-cart.repository.ts";

describe("PrismaCartRepository.replaceCartItemsBatch", () => {
	it("should clear previous user cart items, remove carts from other restaurants, and insert batch items atomically", async () => {
		const deletedAddonCartItemIds: string[] = [];
		const deletedCartItemIds: string[] = [];
		const deletedOtherCartIds: string[] = [];
		const createdCartItems: Array<Record<string, unknown>> = [];
		const createdAddons: Array<Record<string, unknown>> = [];

		const now = new Date();
		const expiresAt = new Date(now.getTime() + 86400000);

		const mockTx = {
			cart: {
				findMany: async () => [
					{
						id: "old-cart-other-rest",
						restaurantId: "rest-old",
						items: [{ id: "old-item-1" }],
					},
					{
						id: "cart-target-rest",
						restaurantId: "rest-target",
						items: [{ id: "old-item-2" }],
					},
				],
				deleteMany: async (args: { where: { id: { in: string[] } } }) => {
					deletedOtherCartIds.push(...args.where.id.in);
					return { count: args.where.id.in.length };
				},
				upsert: async () => ({
					id: "cart-target-rest",
					userId: "user-1",
					restaurantId: "rest-target",
					expiresAt,
					createdAt: now,
					updatedAt: now,
				}),
				findUnique: async () => ({
					id: "cart-target-rest",
					userId: "user-1",
					restaurantId: "rest-target",
					expiresAt,
					createdAt: now,
					updatedAt: now,
					items: [
						{
							id: "new-item-1",
							cartId: "cart-target-rest",
							menuItemId: "menu-1",
							menuItemName: "Paneer Butter Masala",
							variantId: "var-1",
							variantName: "Full",
							quantity: 2,
							unitPrice: 350,
							totalPrice: 750,
							specialInstructions: "Extra spicy",
							createdAt: now,
							updatedAt: now,
							addons: [
								{
									id: "new-addon-1",
									cartItemId: "new-item-1",
									addonId: "adn-1",
									addonName: "Extra Butter",
									price: 25,
								},
							],
						},
					],
				}),
			},
			cartItemAddon: {
				deleteMany: async (args: {
					where: { cartItemId: { in: string[] } };
				}) => {
					deletedAddonCartItemIds.push(...args.where.cartItemId.in);
					return { count: args.where.cartItemId.in.length };
				},
				createMany: async (args: { data: Array<Record<string, unknown>> }) => {
					createdAddons.push(...args.data);
					return { count: args.data.length };
				},
			},
			cartItem: {
				deleteMany: async (args: { where: { id: { in: string[] } } }) => {
					deletedCartItemIds.push(...args.where.id.in);
					return { count: args.where.id.in.length };
				},
				create: async (args: { data: Record<string, unknown> }) => {
					createdCartItems.push(args.data);
					return { id: "new-item-1", ...args.data };
				},
			},
		};

		const mockPrisma = {
			cart: mockTx.cart,
			$transaction: async <T>(fn: (tx: typeof mockTx) => Promise<T>) =>
				fn(mockTx),
		} as unknown as PrismaClient;

		const repository = new PrismaCartRepository(mockPrisma);

		const result = await repository.replaceCartItemsBatch({
			userId: "user-1",
			restaurantId: "rest-target",
			items: [
				{
					menuItemId: "menu-1",
					menuItemName: "Paneer Butter Masala",
					variantId: "var-1",
					variantName: "Full",
					quantity: 2,
					specialInstructions: "Extra spicy",
					unitPrice: 350,
					totalPrice: 750,
					itemAddons: [
						{
							addonId: "adn-1",
							name: "Extra Butter",
							price: 25,
						},
					],
				},
			],
		});

		assert.deepEqual(deletedAddonCartItemIds, ["old-item-1", "old-item-2"]);
		assert.deepEqual(deletedCartItemIds, ["old-item-1", "old-item-2"]);
		assert.deepEqual(deletedOtherCartIds, ["old-cart-other-rest"]);
		assert.equal(createdCartItems.length, 1);
		assert.equal(createdAddons.length, 1);
		assert.equal(result.id, "cart-target-rest");
		assert.equal(result.items.length, 1);
		assert.equal(result.calculateSubtotal(), 750);
	});
});
