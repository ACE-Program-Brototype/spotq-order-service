import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetCartUseCase } from "@application/use-cases/cart/get-cart.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import type {
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();
	public updatedStatuses: Map<string, CartStatus> = new Map();

	public async findById(cartId: string): Promise<Cart | null> {
		return this.carts.get(cartId) ?? null;
	}

	public async update(
		cartId: string,
		data: UpdateCartInput,
	): Promise<Cart | null> {
		if (data.status) {
			this.updatedStatuses.set(cartId, data.status);
		}
		const existing = this.carts.get(cartId);
		if (existing && data.status) {
			existing.status = data.status;
		}
		return existing ?? null;
	}

	public async findActiveByUserId(
		userId: string,
		restaurantId?: string,
	): Promise<Cart | null> {
		for (const cart of this.carts.values()) {
			if (
				cart.userId === userId &&
				(!restaurantId || cart.restaurantId === restaurantId) &&
				!cart.isExpired()
			) {
				return cart;
			}
		}
		return null;
	}

	public async addItem(): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async updateItemQuantity(
		_cartId: string,
		_cartItemId: string,
		_quantity: number,
	): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async removeItem(_cartId: string, _cartItemId: string): Promise<Cart> {
		throw new Error("Not implemented");
	}

	public async clearCart(_cartId: string): Promise<Cart> {
		throw new Error("Not implemented");
	}
}

describe("GetCartUseCase", () => {
	it("should successfully retrieve cart details with items and calculated totals", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const cartId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
		const userId = "7c1a9d44-22f4-4ab8-91ef-123456789abc";

		const testCart = new Cart({
			id: cartId,
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: "item-1",
					cartId,
					menuItemId: "menu-1",
					menuItemName: "Classic Margherita Pizza",
					variantId: "var-1",
					variantName: "Medium",
					quantity: 2,
					unitPrice: 249,
					specialInstructions: "Extra crispy crust",
					addons: [
						new CartItemAddon({
							id: "addon-1",
							cartItemId: "item-1",
							addonId: "adn-1",
							addonName: "Extra Mozzarella Cheese",
							price: 20,
						}),
					],
				}),
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repo.carts.set(cartId, testCart);

		const result = await useCase.execute({
			cartId,
			authenticatedUserId: userId,
		});

		assert.equal(result.cartId, cartId);
		assert.equal(result.itemCount, 2);
		assert.equal(result.subtotal, 538);
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.cartItemId, "item-1");
		assert.equal(result.items[0]?.addons.length, 1);
		assert.equal(result.items[0]?.addons[0]?.price, 20);
	});

	it("should throw CartNotFoundError when cart does not exist", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					cartId: "non-existent-cart",
					authenticatedUserId: "user-1",
				});
			},
			(err: unknown) => {
				assert.ok(err instanceof CartNotFoundError);
				return true;
			},
		);
	});

	it("should throw ForbiddenCartAccessError when cart belongs to another user", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const cartId = "cart-123";
		const testCart = new Cart({
			id: cartId,
			restaurantId: "rest-1",
			userId: "owner-user-id",
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repo.carts.set(cartId, testCart);

		await assert.rejects(
			async () => {
				await useCase.execute({
					cartId,
					authenticatedUserId: "different-user-id",
				});
			},
			(err: unknown) => {
				assert.ok(err instanceof ForbiddenCartAccessError);
				return true;
			},
		);
	});

	it("should throw CartExpiredError when cart validity window has passed", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const cartId = "expired-cart-123";
		const userId = "user-123";

		const expiredCart = new Cart({
			id: cartId,
			restaurantId: "rest-1",
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 10000),
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repo.carts.set(cartId, expiredCart);

		await assert.rejects(
			async () => {
				await useCase.execute({
					cartId,
					authenticatedUserId: userId,
				});
			},
			(err: unknown) => {
				assert.ok(err instanceof CartExpiredError);
				return true;
			},
		);
	});

	it("should retrieve active cart by authenticatedUserId when cartId is not provided", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const cartId = "user-active-cart-1";
		const userId = "user-789";
		const restaurantId = "rest-999";

		const testCart = new Cart({
			id: cartId,
			restaurantId,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: "item-10",
					cartId,
					menuItemId: "menu-10",
					menuItemName: "Garlic Bread",
					variantId: null,
					variantName: null,
					quantity: 1,
					unitPrice: 120,
					specialInstructions: null,
					addons: [],
				}),
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});

		repo.carts.set(cartId, testCart);

		const result = await useCase.execute({
			authenticatedUserId: userId,
		});

		assert.equal(result.cartId, cartId);
		assert.equal(result.userId, userId);
		assert.equal(result.restaurantId, restaurantId);
		assert.equal(result.itemCount, 1);
		assert.equal(result.subtotal, 120);
		assert.equal(result.items.length, 1);
	});

	it("should retrieve active cart scoped to restaurantId when provided", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const userId = "user-multi-rest";
		const restA = "rest-a";
		const restB = "rest-b";

		const cartA = new Cart({
			id: "cart-a",
			restaurantId: restA,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [],
		});

		const cartB = new Cart({
			id: "cart-b",
			restaurantId: restB,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [],
		});

		repo.carts.set("cart-a", cartA);
		repo.carts.set("cart-b", cartB);

		const result = await useCase.execute({
			authenticatedUserId: userId,
			restaurantId: restB,
		});

		assert.equal(result.cartId, "cart-b");
		assert.equal(result.restaurantId, restB);
	});

	it("should return empty cart representation when user has no active cart", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const userId = "user-without-cart";
		const result = await useCase.execute({
			authenticatedUserId: userId,
			restaurantId: "rest-xyz",
		});

		assert.equal(result.cartId, null);
		assert.equal(result.restaurantId, "rest-xyz");
		assert.equal(result.userId, userId);
		assert.equal(result.itemCount, 0);
		assert.equal(result.subtotal, 0);
		assert.equal(result.items.length, 0);
		assert.equal(result.status, CartStatus.ACTIVE);
	});

	it("should return empty cart representation when user active cart has expired", async () => {
		const repo = new MockCartRepository();
		const useCase = new GetCartUseCase(repo);

		const userId = "user-expired-active";
		const expiredCart = new Cart({
			id: "expired-user-cart",
			restaurantId: "rest-expired",
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 5000),
			items: [],
		});

		repo.carts.set("expired-user-cart", expiredCart);

		const result = await useCase.execute({
			authenticatedUserId: userId,
		});

		assert.equal(result.cartId, null);
		assert.equal(result.userId, userId);
		assert.equal(result.itemCount, 0);
		assert.equal(result.items.length, 0);
	});
});
