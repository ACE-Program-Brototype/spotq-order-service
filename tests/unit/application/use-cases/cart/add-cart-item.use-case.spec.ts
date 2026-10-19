import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import { AddCartItemUseCase } from "@application/use-cases/cart/add-cart-item.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { InvalidCartQuantityError } from "@domain/errors/invalid-cart-quantity.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import type {
	AddItemInput,
	ICartRepository,
} from "@domain/repositories/cart.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();

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
		data: { status?: CartStatus; expiresAt?: Date },
	): Promise<Cart | null> {
		const existing = this.carts.get(cartId);
		if (existing && data.status) {
			existing.status = data.status;
		}
		return existing ?? null;
	}

	public async addItem(input: AddItemInput): Promise<Cart> {
		let cart = this.carts.get(input.cartId);
		if (!cart) {
			cart = new Cart({
				id: input.cartId,
				restaurantId: input.restaurantId ?? "default-restaurant",
				userId: input.userId ?? "default-user",
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			});
			this.carts.set(input.cartId, cart);
		}

		const targetAddonSignature = [...(input.addonIds ?? [])].sort().join(",");
		const existingItem = cart.items.find((item) => {
			if (item.menuItemId !== input.menuItemId) return false;
			if ((item.variantId ?? null) !== (input.variantId ?? null)) return false;
			if (
				(item.specialInstructions ?? "").trim() !==
				(input.specialInstructions ?? "").trim()
			)
				return false;
			const existingSig = item.addons
				.map((a) => a.addonId)
				.sort()
				.join(",");
			return existingSig === targetAddonSignature;
		});

		if (existingItem) {
			const updatedItem = new CartItem({
				id: existingItem.id,
				cartId: existingItem.cartId,
				menuItemId: existingItem.menuItemId,
				variantId: existingItem.variantId,
				quantity: existingItem.quantity + input.quantity,
				unitPrice: input.unitPrice,
				specialInstructions: existingItem.specialInstructions,
				addons: existingItem.addons.map((a) => ({
					id: a.id,
					cartItemId: a.cartItemId,
					addonId: a.addonId,
					price: input.itemAddons.find((ia) => ia.addonId === a.addonId)?.price,
				})),
			});
			const index = cart.items.indexOf(existingItem);
			cart.items[index] = updatedItem;
		} else {
			const newItem = new CartItem({
				id: "new-item-id",
				cartId: input.cartId,
				menuItemId: input.menuItemId,
				variantId: input.variantId ?? null,
				quantity: input.quantity,
				unitPrice: input.unitPrice,
				specialInstructions: input.specialInstructions ?? null,
				addons: (input.itemAddons ?? []).map((addon) => ({
					id: `addon-${addon.addonId}`,
					cartItemId: "new-item-id",
					addonId: addon.addonId,
					price: addon.price,
				})),
			});
			cart.items.push(newItem);
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

class MockCatalogPort implements IMenuItemCatalogPort {
	public items: Map<string, CatalogItemDetails> = new Map();

	public async getItemDetails(
		_restaurantId: string,
		menuItemId: string,
	): Promise<CatalogItemDetails | null> {
		return this.items.get(menuItemId) ?? null;
	}
}

describe("AddCartItemUseCase", () => {
	const cartId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
	const restaurantId = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const userId = "7c1a9d44-22f4-4ab8-91ef-123456789abc";
	const menuItemId = "3f2a1b00-55de-4d39-a9a7-9f6b986e8123";

	it("should successfully add a new item to cart and calculate correct totals", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		catalogPort.items.set(menuItemId, {
			menuItemId,
			name: "Classic Margherita Pizza",
			price: 249,
			isAvailable: true,
			addons: [
				{
					addonId: "addon-1",
					name: "Extra Cheese",
					price: 40,
					isAvailable: true,
				},
			],
		});

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		const result = await useCase.execute({
			cartId,
			authenticatedUserId: userId,
			restaurantId,
			menuItemId,
			addonIds: ["addon-1"],
			quantity: 2,
			specialInstructions: "Crispy crust",
		});

		assert.equal(result.cartId, cartId);
		assert.equal(result.restaurantId, restaurantId);
		assert.equal(result.itemCount, 2);
		assert.equal(result.subtotal, 578);
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.quantity, 2);
	});

	it("should increment quantity atomically when adding identical line item", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		const existingItem = new CartItem({
			id: "existing-item-id",
			cartId,
			menuItemId,
			variantId: null,
			quantity: 1,
			unitPrice: 249,
			specialInstructions: "Crispy crust",
			addons: [
				new CartItemAddon({
					id: "addon-row-1",
					cartItemId: "existing-item-id",
					addonId: "addon-1",
					price: 40,
				}),
			],
		});

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [existingItem],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		catalogPort.items.set(menuItemId, {
			menuItemId,
			name: "Classic Margherita Pizza",
			price: 249,
			isAvailable: true,
			addons: [
				{
					addonId: "addon-1",
					name: "Extra Cheese",
					price: 40,
					isAvailable: true,
				},
			],
		});

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		const result = await useCase.execute({
			cartId,
			authenticatedUserId: userId,
			restaurantId,
			menuItemId,
			addonIds: ["addon-1"],
			quantity: 2,
			specialInstructions: "Crispy crust",
		});

		assert.equal(result.itemCount, 3);
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.quantity, 3);
	});

	it("should throw DifferentRestaurantCartError when restaurantId does not match cart with existing items", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId: "restaurant-a",
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [
					new CartItem({
						id: "item-1",
						cartId,
						menuItemId: "item-a",
						quantity: 1,
						unitPrice: 100,
						totalPrice: 100,
					}),
				],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId: "restaurant-b",
				menuItemId,
				quantity: 1,
			}),
			(err) => err instanceof DifferentRestaurantCartError,
		);
	});

	it("should allow adding items from a new restaurant when existing cart has 0 items", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId: "restaurant-a",
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		catalogPort.items.set(menuItemId, {
			menuItemId,
			name: "Classic Margherita Pizza",
			price: 249,
			isAvailable: true,
			addons: [],
		});

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		const result = await useCase.execute({
			cartId,
			authenticatedUserId: userId,
			restaurantId: "restaurant-b",
			menuItemId,
			quantity: 1,
		});

		assert.equal(result.cartId, cartId);
		assert.equal(result.itemCount, 1);
	});

	it("should throw InvalidCartQuantityError when aggregated quantity exceeds 20", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [
					new CartItem({
						id: "item-1",
						cartId,
						menuItemId,
						quantity: 15,
						unitPrice: 249,
						totalPrice: 3735,
						addons: [],
					}),
				],
			}),
		);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId,
				menuItemId,
				quantity: 10,
			}),
			(err) => err instanceof InvalidCartQuantityError,
		);
	});

	it("should automatically initialize a new cart when adding an item for a new customer without an existing cart", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		catalogPort.items.set(menuItemId, {
			menuItemId,
			name: "Classic Margherita Pizza",
			price: 249,
			isAvailable: true,
			addons: [],
		});

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		const result = await useCase.execute({
			cartId: "brand-new-cart-id",
			authenticatedUserId: userId,
			restaurantId,
			menuItemId,
			quantity: 1,
		});

		assert.equal(result.cartId, "brand-new-cart-id");
		assert.equal(result.restaurantId, restaurantId);
		assert.equal(result.itemCount, 1);
		assert.equal(result.subtotal, 249);
		assert.equal(result.items.length, 1);
	});

	it("should throw DifferentRestaurantCartError when user has an active cart for another restaurant", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		const activeCartOtherRestaurant = new Cart({
			id: "existing-cart-id",
			restaurantId: "restaurant-a",
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: "item-1",
					cartId: "existing-cart-id",
					menuItemId: "item-from-a",
					quantity: 1,
					unitPrice: 100,
					addons: [],
				}),
			],
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		cartRepo.carts.set(activeCartOtherRestaurant.id, activeCartOtherRestaurant);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId: "new-cart-id",
				authenticatedUserId: userId,
				restaurantId: "restaurant-b",
				menuItemId,
				quantity: 1,
			}),
			(err) => err instanceof DifferentRestaurantCartError,
		);
	});

	it("should throw ForbiddenCartAccessError when cart belongs to another user", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId: "other-user",
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId,
				menuItemId,
				quantity: 1,
			}),
			(err) => err instanceof ForbiddenCartAccessError,
		);
	});

	it("should throw CartExpiredError when cart has expired", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() - 1000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId,
				menuItemId,
				quantity: 1,
			}),
			(err) => err instanceof CartExpiredError,
		);
	});

	it("should throw MenuItemNotFoundError when item does not exist in catalog", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId,
				menuItemId: "invalid-item",
				quantity: 1,
			}),
			(err) => err instanceof MenuItemNotFoundError,
		);
	});

	it("should throw ItemUnavailableError when item is marked unavailable", async () => {
		const cartRepo = new MockCartRepository();
		const catalogPort = new MockCatalogPort();

		cartRepo.carts.set(
			cartId,
			new Cart({
				id: cartId,
				restaurantId,
				userId,
				status: CartStatus.ACTIVE,
				expiresAt: new Date(Date.now() + 86400000),
				items: [],
				createdAt: new Date(),
				updatedAt: new Date(),
			}),
		);

		catalogPort.items.set(menuItemId, {
			menuItemId,
			name: "Out of Stock Pizza",
			price: 249,
			isAvailable: false,
			addons: [],
		});

		const useCase = new AddCartItemUseCase(cartRepo, catalogPort);
		await assert.rejects(
			useCase.execute({
				cartId,
				authenticatedUserId: userId,
				restaurantId,
				menuItemId,
				quantity: 1,
			}),
			(err) => err instanceof ItemUnavailableError,
		);
	});
});
