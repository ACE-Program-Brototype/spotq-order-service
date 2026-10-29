import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/cart/update-cart-item-quantity.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/i-cart.repository.ts";

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
		throw new Error("Not implemented in this test");
	}

	public async replaceCartItemsBatch(): Promise<Cart> {
		throw new Error("Not implemented in this test");
	}

	public async updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart> {
		const cart = this.carts.get(cartId);
		if (!cart) throw new Error("Cart not found");

		const itemIndex = cart.items.findIndex((item) => item.id === cartItemId);
		if (itemIndex === -1) throw new Error("Item not found");

		if (quantity === 0) {
			cart.items.splice(itemIndex, 1);
		} else {
			const existingItem = cart.items[itemIndex];
			if (!existingItem) throw new Error("Item not found");
			const addonsTotal = existingItem.addons.reduce(
				(sum, a) => sum + a.price,
				0,
			);
			const newTotalPrice = (existingItem.unitPrice + addonsTotal) * quantity;

			const updatedItem = new CartItem({
				id: existingItem.id,
				cartId: existingItem.cartId,
				menuItemId: existingItem.menuItemId,
				menuItemName: existingItem.menuItemName,
				variantId: existingItem.variantId,
				variantName: existingItem.variantName,
				quantity,
				unitPrice: existingItem.unitPrice,
				totalPrice: newTotalPrice,
				specialInstructions: existingItem.specialInstructions,
				addons: existingItem.addons.map((a) => ({
					id: a.id,
					cartItemId: a.cartItemId,
					addonId: a.addonId,
					addonName: a.addonName,
					price: a.price,
				})),
			});

			cart.items[itemIndex] = updatedItem;
		}

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

	public async removeItem(cartId: string, cartItemId: string): Promise<Cart> {
		return this.updateItemQuantity(cartId, cartItemId, 0);
	}

	public async clearCart(_cartId: string): Promise<Cart> {
		throw new Error("Not implemented in this test");
	}
}

class MockCatalogPort implements IMenuItemCatalogPort {
	public mockItem: CatalogItemDetails | null = null;
	public callCount = 0;

	public async getItemDetails(
		_restaurantId: string,
		_menuItemId: string,
		_variantId?: string | null,
		_addonIds?: string[],
	): Promise<CatalogItemDetails | null> {
		this.callCount++;
		return this.mockItem;
	}
}

describe("UpdateCartItemQuantityUseCase", () => {
	const validCartId = "c1000000-0000-0000-0000-000000000001";
	const validUserId = "u1000000-0000-0000-0000-000000000001";
	const validRestaurantId = "r1000000-0000-0000-0000-000000000001";
	const validItemId = "i1000000-0000-0000-0000-000000000001";
	const validMenuItemId = "m1000000-0000-0000-0000-000000000001";

	const createSampleCart = (
		expiresAt: Date = new Date(Date.now() + 86400000),
	) => {
		return new Cart({
			id: validCartId,
			restaurantId: validRestaurantId,
			userId: validUserId,
			status: CartStatus.ACTIVE,
			expiresAt,
			items: [
				new CartItem({
					id: validItemId,
					cartId: validCartId,
					menuItemId: validMenuItemId,
					menuItemName: "Burger",
					quantity: 1,
					unitPrice: 100,
					totalPrice: 100,
					addons: [
						new CartItemAddon({
							id: "a1",
							cartItemId: validItemId,
							addonId: "add-1",
							addonName: "Extra Cheese",
							price: 20,
						}),
					],
				}),
			],
		});
	};

	it("successfully increases item quantity and updates totals", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		catalog.mockItem = {
			menuItemId: validMenuItemId,
			name: "Burger",
			price: 100,
			isAvailable: true,
			addons: [
				{
					addonId: "add-1",
					name: "Extra Cheese",
					price: 20,
					isAvailable: true,
				},
			],
		};

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: validItemId,
			quantity: 3,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.itemCount, 3);
		assert.equal(res.subtotal, 360); // (100 + 20) * 3
		assert.equal(res.items.length, 1);
		assert.equal(res.items[0]?.quantity, 3);
		assert.equal(res.items[0]?.totalPrice, 360);
		assert.equal(catalog.callCount, 1);
	});

	it("successfully decreases item quantity and updates totals", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		const cart = createSampleCart();
		// set initial quantity = 3
		cart.items[0] = new CartItem({
			id: validItemId,
			cartId: validCartId,
			menuItemId: validMenuItemId,
			quantity: 3,
			unitPrice: 100,
			totalPrice: 360,
			addons: [
				new CartItemAddon({
					id: "a1",
					cartItemId: validItemId,
					addonId: "add-1",
					price: 20,
				}),
			],
		});
		repo.carts.set(validCartId, cart);

		catalog.mockItem = {
			menuItemId: validMenuItemId,
			name: "Burger",
			price: 100,
			isAvailable: true,
			addons: [
				{
					addonId: "add-1",
					name: "Extra Cheese",
					price: 20,
					isAvailable: true,
				},
			],
		};

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: validItemId,
			quantity: 1,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.itemCount, 1);
		assert.equal(res.subtotal, 120);
		assert.equal(res.items[0]?.quantity, 1);
		assert.equal(res.items[0]?.totalPrice, 120);
	});

	it("gracefully removes item and addons when quantity is 0 without calling catalog", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: validItemId,
			quantity: 0,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.cartId, validCartId);
		assert.equal(res.itemCount, 0);
		assert.equal(res.subtotal, 0);
		assert.equal(res.items.length, 0);
		assert.equal(catalog.callCount, 0); // No catalog call when quantity is 0
	});

	it("supports boundary limit of quantity 20", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		catalog.mockItem = {
			menuItemId: validMenuItemId,
			name: "Burger",
			price: 100,
			isAvailable: true,
			addons: [
				{
					addonId: "add-1",
					name: "Extra Cheese",
					price: 20,
					isAvailable: true,
				},
			],
		};

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);
		const res = await useCase.execute({
			cartId: validCartId,
			cartItemId: validItemId,
			quantity: 20,
			authenticatedUserId: validUserId,
		});

		assert.equal(res.itemCount, 20);
		assert.equal(res.subtotal, 2400); // (100 + 20) * 20
	});

	it("throws CartNotFoundError if cart does not exist", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: "c9999999-9999-9999-9999-999999999999",
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			CartNotFoundError,
		);
	});

	it("throws ForbiddenCartAccessError if cart belongs to another user", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: "u9999999-9999-9999-9999-999999999999",
				}),
			ForbiddenCartAccessError,
		);
	});

	it("throws CartExpiredError and updates cart status when cart is expired", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		const expiredCart = createSampleCart(new Date(Date.now() - 3600000));
		repo.carts.set(validCartId, expiredCart);

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			CartExpiredError,
		);

		assert.equal(repo.carts.get(validCartId)?.status, CartStatus.EXPIRED);
	});

	it("throws CartItemNotFoundError when cart item does not exist in cart", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: "i9999999-9999-9999-9999-999999999999",
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			CartItemNotFoundError,
		);
	});

	it("throws MenuItemNotFoundError when item not found in catalog for quantity > 0", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		catalog.mockItem = null;

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			MenuItemNotFoundError,
		);
	});

	it("throws ItemUnavailableError when menu item is marked unavailable", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		catalog.mockItem = {
			menuItemId: validMenuItemId,
			name: "Burger",
			price: 100,
			isAvailable: false,
			addons: [],
		};

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			ItemUnavailableError,
		);
	});

	it("throws ItemUnavailableError when an addon is marked unavailable", async () => {
		const repo = new MockCartRepository();
		const catalog = new MockCatalogPort();
		repo.carts.set(validCartId, createSampleCart());
		catalog.mockItem = {
			menuItemId: validMenuItemId,
			name: "Burger",
			price: 100,
			isAvailable: true,
			addons: [
				{
					addonId: "add-1",
					name: "Extra Cheese",
					price: 20,
					isAvailable: false,
				},
			],
		};

		const useCase = new UpdateCartItemQuantityUseCase(repo, catalog);

		await assert.rejects(
			() =>
				useCase.execute({
					cartId: validCartId,
					cartItemId: validItemId,
					quantity: 2,
					authenticatedUserId: validUserId,
				}),
			ItemUnavailableError,
		);
	});
});
