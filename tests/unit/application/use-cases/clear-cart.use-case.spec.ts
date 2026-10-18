import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ClearCartUseCase } from "@application/use-cases/clear-cart.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();
	public clearCartCallCount = 0;

	public async findById(cartId: string): Promise<Cart | null> {
		return this.carts.get(cartId) ?? null;
	}

	public async findActiveByUserId(userId: string): Promise<Cart | null> {
		for (const cart of this.carts.values()) {
			if (cart.userId === userId && !cart.isExpired()) {
				return cart;
			}
		}
		return null;
	}

	public async update(
		cartId: string,
		data: UpdateCartInput,
	): Promise<Cart | null> {
		const existing = this.carts.get(cartId);
		if (existing && data.status) {
			existing.status = data.status;
		}
		return existing ?? null;
	}

	public async addItem(_input: AddItemInput): Promise<Cart> {
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

	public async clearCart(cartId: string): Promise<Cart> {
		this.clearCartCallCount++;
		const cart = this.carts.get(cartId);
		if (!cart) throw new Error("Cart not found");

		const clearedCart = new Cart({
			id: cart.id,
			restaurantId: cart.restaurantId,
			userId: cart.userId,
			status: cart.status,
			expiresAt: new Date(Date.now() + 86400000),
			items: [],
			createdAt: cart.createdAt,
			updatedAt: new Date(),
		});

		this.carts.set(cartId, clearedCart);
		return clearedCart;
	}
}

describe("ClearCartUseCase", () => {
	const validCartId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
	const validUserId = "7c1a9d44-22f4-4ab8-91ef-123456789abc";
	const validRestaurantId = "e2f4104e-97af-4ed2-88ad-92beef8f159d";

	const createPopulatedCart = () => {
		return new Cart({
			id: validCartId,
			restaurantId: validRestaurantId,
			userId: validUserId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: "item-1",
					cartId: validCartId,
					menuItemId: "menu-1",
					quantity: 3,
					unitPrice: 100,
					totalPrice: 300,
					addons: [],
				}),
				new CartItem({
					id: "item-2",
					cartId: validCartId,
					menuItemId: "menu-2",
					quantity: 2,
					unitPrice: 200,
					totalPrice: 400,
					addons: [],
				}),
			],
		});
	};

	it("successfully clears a populated cart and resets totals", async () => {
		const repo = new MockCartRepository();
		repo.carts.set(validCartId, createPopulatedCart());

		const useCase = new ClearCartUseCase(repo);
		const res = await useCase.execute({
			cartId: validCartId,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.restaurantId, null);
		assert.equal(res.itemCount, 0);
		assert.equal(res.subtotal, 0);
		assert.deepEqual(res.items, []);
		assert.equal(repo.clearCartCallCount, 1);
	});

	it("is idempotent when clearing an already empty cart", async () => {
		const repo = new MockCartRepository();
		const emptyCart = new Cart({
			id: validCartId,
			restaurantId: validRestaurantId,
			userId: validUserId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [],
		});
		repo.carts.set(validCartId, emptyCart);

		const useCase = new ClearCartUseCase(repo);
		const res = await useCase.execute({
			cartId: validCartId,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.itemCount, 0);
		assert.equal(res.subtotal, 0);
		assert.deepEqual(res.items, []);
		assert.equal(repo.clearCartCallCount, 0); // No DB transaction if already empty
	});

	it("throws CartNotFoundError if cart does not exist", async () => {
		const repo = new MockCartRepository();
		const useCase = new ClearCartUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: "00000000-0000-4000-a000-000000000000",
					authenticatedUserId: validUserId,
				}),
			CartNotFoundError,
		);
	});

	it("throws ForbiddenCartAccessError if cart belongs to another user", async () => {
		const repo = new MockCartRepository();
		repo.carts.set(validCartId, createPopulatedCart());

		const useCase = new ClearCartUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					authenticatedUserId: "99999999-9999-4999-a999-999999999999",
				}),
			ForbiddenCartAccessError,
		);
	});

	it("throws CartExpiredError if cart has expired", async () => {
		const repo = new MockCartRepository();
		const expiredCart = new Cart({
			id: validCartId,
			restaurantId: validRestaurantId,
			userId: validUserId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 3600000),
			items: [],
		});
		repo.carts.set(validCartId, expiredCart);

		const useCase = new ClearCartUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					authenticatedUserId: validUserId,
				}),
			CartExpiredError,
		);

		assert.equal(repo.carts.get(validCartId)?.status, CartStatus.EXPIRED);
	});
});
