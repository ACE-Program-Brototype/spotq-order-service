import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { RemoveCartItemUseCase } from "@application/use-cases/cart/remove-cart-item.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();

	public async findById(cartId: string): Promise<Cart | null> {
		return this.carts.get(cartId) ?? null;
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

	public async removeItem(cartId: string, cartItemId: string): Promise<Cart> {
		const cart = this.carts.get(cartId);
		if (!cart) throw new Error("Cart not found");

		const itemIndex = cart.items.findIndex((item) => item.id === cartItemId);
		if (itemIndex === -1) throw new Error("Item not found");

		cart.items.splice(itemIndex, 1);

		return new Cart({
			id: cart.id,
			restaurantId: cart.restaurantId,
			userId: cart.userId,
			status: cart.status,
			expiresAt: new Date(Date.now() + 86400000),
			items: cart.items,
			createdAt: cart.createdAt,
			updatedAt: new Date(),
		});
	}

	public async findActiveByUserId(userId: string): Promise<Cart | null> {
		for (const cart of this.carts.values()) {
			if (cart.userId === userId && !cart.isExpired()) {
				return cart;
			}
		}
		return null;
	}

	public async clearCart(_cartId: string): Promise<Cart> {
		throw new Error("Not implemented");
	}
}

describe("RemoveCartItemUseCase", () => {
	const validCartId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
	const validUserId = "7c1a9d44-22f4-4ab8-91ef-123456789abc";
	const validRestaurantId = "e2f4104e-97af-4ed2-88ad-92beef8f159d";
	const item1Id = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const item2Id = "3f2a1b00-55de-4d39-a9a7-9f6b986e8123";

	const createCartWithTwoItems = () => {
		return new Cart({
			id: validCartId,
			restaurantId: validRestaurantId,
			userId: validUserId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: item1Id,
					cartId: validCartId,
					menuItemId: "menu-item-1",
					quantity: 2,
					unitPrice: 100,
					totalPrice: 200,
					addons: [],
				}),
				new CartItem({
					id: item2Id,
					cartId: validCartId,
					menuItemId: "menu-item-2",
					quantity: 1,
					unitPrice: 150,
					totalPrice: 150,
					addons: [],
				}),
			],
		});
	};

	it("successfully removes an item from a multi-item cart", async () => {
		const repo = new MockCartRepository();
		repo.carts.set(validCartId, createCartWithTwoItems());

		const useCase = new RemoveCartItemUseCase(repo);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: item1Id,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.itemCount, 1);
		assert.equal(res.subtotal, 150);
		assert.equal(res.items.length, 1);
		assert.equal(res.items[0]?.cartItemId, item2Id);
	});

	it("successfully removes the last item leaving cart active with empty items", async () => {
		const repo = new MockCartRepository();
		const cart = createCartWithTwoItems();
		cart.items.pop(); // keep only item1
		repo.carts.set(validCartId, cart);

		const useCase = new RemoveCartItemUseCase(repo);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: item1Id,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.itemCount, 0);
		assert.equal(res.subtotal, 0);
		assert.deepEqual(res.items, []);
	});

	it("throws CartNotFoundError if cart does not exist", async () => {
		const repo = new MockCartRepository();
		const useCase = new RemoveCartItemUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: "00000000-0000-4000-a000-000000000000",
					cartItemId: item1Id,
					authenticatedUserId: validUserId,
				}),
			CartNotFoundError,
		);
	});

	it("throws ForbiddenCartAccessError if cart belongs to another user", async () => {
		const repo = new MockCartRepository();
		repo.carts.set(validCartId, createCartWithTwoItems());

		const useCase = new RemoveCartItemUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: item1Id,
					authenticatedUserId: "99999999-9999-4999-a999-999999999999",
				}),
			ForbiddenCartAccessError,
		);
	});

	it("throws CartExpiredError if cart has expired", async () => {
		const repo = new MockCartRepository();
		const cart = createCartWithTwoItems();
		// set expired timestamp
		const expiredCart = new Cart({
			id: cart.id,
			restaurantId: cart.restaurantId,
			userId: cart.userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 3600000),
			items: cart.items,
		});
		repo.carts.set(validCartId, expiredCart);

		const useCase = new RemoveCartItemUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: item1Id,
					authenticatedUserId: validUserId,
				}),
			CartExpiredError,
		);

		assert.equal(repo.carts.get(validCartId)?.status, CartStatus.EXPIRED);
	});

	it("throws CartItemNotFoundError if item does not exist in cart", async () => {
		const repo = new MockCartRepository();
		repo.carts.set(validCartId, createCartWithTwoItems());

		const useCase = new RemoveCartItemUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: "00000000-0000-4000-a000-000000000000",
					authenticatedUserId: validUserId,
				}),
			CartItemNotFoundError,
		);
	});
});
