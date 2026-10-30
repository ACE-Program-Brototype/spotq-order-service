import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RestaurantValidationResultDto } from "@application/dtos/external/restaurant-validation.dto.ts";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import { GetCheckoutDetailsUseCase } from "@application/use-cases/orders/get-checkout-details.use-case.ts";
import env from "@config/env.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import { RestaurantNotEligibleError } from "@domain/errors/restaurant-not-eligible.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	ReplaceCartBatchInput,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();
	public updatedCarts: Map<string, UpdateCartInput> = new Map();

	public async findById(cartId: string): Promise<Cart | null> {
		return this.carts.get(cartId) ?? null;
	}

	public async findActiveByUserId(
		userId: string,
		restaurantId?: string,
	): Promise<Cart | null> {
		for (const cart of this.carts.values()) {
			if (
				cart.userId === userId &&
				cart.status === CartStatus.ACTIVE &&
				(!restaurantId || cart.restaurantId === restaurantId)
			) {
				return cart;
			}
		}
		return null;
	}

	public async update(
		cartId: string,
		data: UpdateCartInput,
	): Promise<Cart | null> {
		this.updatedCarts.set(cartId, data);
		const existing = this.carts.get(cartId);
		if (existing) {
			if (data.status) existing.status = data.status;
			return existing;
		}
		return null;
	}

	public async addItem(_input: AddItemInput): Promise<Cart> {
		throw new Error("Not implemented in test");
	}

	public async replaceCartItemsBatch(
		_input: ReplaceCartBatchInput,
	): Promise<Cart> {
		throw new Error("Not implemented in test");
	}

	public async updateItemQuantity(
		_cartId: string,
		_cartItemId: string,
		_quantity: number,
	): Promise<Cart> {
		throw new Error("Not implemented in test");
	}

	public async removeItem(_cartId: string, _cartItemId: string): Promise<Cart> {
		throw new Error("Not implemented in test");
	}

	public async clearCart(_cartId: string): Promise<Cart> {
		throw new Error("Not implemented in test");
	}
}

class MockRestaurantServiceClient implements IRestaurantServiceClient {
	public mockValidationResult: RestaurantValidationResultDto = {
		restaurantId: "rest-uuid-1",
		restaurantName: "The Gourmet Kitchen",
		verificationStatus: "ACTIVE",
		isBlocked: false,
		blockReason: null,
		isSubscriptionActive: true,
		subscriptionPlanCode: "PREMIUM",
		subscriptionEndsAt: new Date(Date.now() + 86400000).toISOString(),
		canAccessQueueService: true,
	};

	public shouldThrowError: Error | null = null;

	public async validateRestaurant(
		restaurantId: string,
	): Promise<RestaurantValidationResultDto> {
		if (this.shouldThrowError) {
			throw this.shouldThrowError;
		}
		return {
			...this.mockValidationResult,
			restaurantId,
		};
	}
}

class MockMenuItemCatalogPort implements IMenuItemCatalogPort {
	public catalog: Map<string, CatalogItemDetails> = new Map();

	public async getItemDetails(
		_restaurantId: string,
		menuItemId: string,
		variantId?: string | null,
		addonIds?: string[],
	): Promise<CatalogItemDetails | null> {
		const item = this.catalog.get(menuItemId);
		if (!item) return null;

		return {
			...item,
			variant: variantId
				? item.variant?.variantId === variantId
					? item.variant
					: null
				: null,
			addons: item.addons.filter((a) => (addonIds ?? []).includes(a.addonId)),
		};
	}
}

function createSampleCart(
	overrides?: Partial<ConstructorParameters<typeof Cart>[0]>,
): Cart {
	return new Cart({
		id: "cart-uuid-1",
		restaurantId: "rest-uuid-1",
		userId: "user-uuid-1",
		status: CartStatus.ACTIVE,
		expiresAt: new Date(Date.now() + 3600000),
		createdAt: new Date(),
		updatedAt: new Date(),
		items: [
			new CartItem({
				id: "item-uuid-1",
				cartId: "cart-uuid-1",
				menuItemId: "menu-item-1",
				menuItemName: "Burger",
				variantId: "variant-1",
				variantName: "Double",
				quantity: 2,
				unitPrice: 120,
				totalPrice: 280,
				specialInstructions: "Extra crispy",
				addons: [
					new CartItemAddon({
						id: "addon-row-1",
						cartItemId: "item-uuid-1",
						addonId: "addon-1",
						addonName: "Cheese",
						price: 20,
					}),
				],
			}),
		],
		...overrides,
	});
}

describe("GetCheckoutDetailsUseCase", () => {
	it("should successfully retrieve checkout details with catalog verification and calculated tax", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger Deluxe",
			price: 100,
			isAvailable: true,
			variant: {
				variantId: "variant-1",
				name: "Double Deluxe",
				price: 125,
				isAvailable: true,
			},
			addons: [
				{
					addonId: "addon-1",
					name: "Cheddar Cheese",
					price: 25,
					isAvailable: true,
				},
			],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		const result = await useCase.execute({
			userId: "user-uuid-1",
			cartId: "cart-uuid-1",
		});

		// Item line total: (125 [variant] + 25 [addon]) * 2 = 300
		// Subtotal: 300
		// Tax (TAX_PERCENT %): 300 * (env.TAX_PERCENT / 100)
		const expectedTax = Number(((300 * env.TAX_PERCENT) / 100).toFixed(2));
		const expectedTotal = Number((300 + expectedTax).toFixed(2));

		assert.equal(result.cartId, "cart-uuid-1");
		assert.equal(result.restaurantId, "rest-uuid-1");
		assert.equal(result.restaurantName, "The Gourmet Kitchen");
		assert.deepEqual(result.payment, {
			mode: PaymentMode.ONLINE,
			paymentRequired: true,
		});
		assert.equal(result.itemCount, 2);
		assert.equal(result.subtotal, 300);
		assert.equal(result.taxPercent, env.TAX_PERCENT);
		assert.equal(result.taxAmount, expectedTax);
		assert.equal(result.totalAmount, expectedTotal);
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.name, "Burger Deluxe");
		assert.equal(result.items[0]?.variantName, "Double Deluxe");
		assert.equal(result.items[0]?.unitPrice, 125);
		assert.equal(result.items[0]?.totalPrice, 300);
		assert.equal(result.items[0]?.addons[0]?.name, "Cheddar Cheese");
		assert.equal(result.items[0]?.addons[0]?.price, 25);
	});

	it("should find active cart by userId when cartId is not provided", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger",
			price: 100,
			isAvailable: true,
			variant: {
				variantId: "variant-1",
				name: "Double",
				price: 120,
				isAvailable: true,
			},
			addons: [
				{
					addonId: "addon-1",
					name: "Cheese",
					price: 20,
					isAvailable: true,
				},
			],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		const result = await useCase.execute({
			userId: "user-uuid-1",
		});

		assert.equal(result.cartId, "cart-uuid-1");
	});

	it("should throw CartNotFoundError when no active cart exists", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-unknown",
				}),
			(err: unknown) => {
				assert.ok(err instanceof CartNotFoundError);
				return true;
			},
		);
	});

	it("should throw ForbiddenCartAccessError when cart belongs to another user", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart({ userId: "other-user" });
		cartRepo.carts.set(cart.id, cart);

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof ForbiddenCartAccessError);
				return true;
			},
		);
	});

	it("should throw DifferentRestaurantCartError when restaurantId does not match", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart({ restaurantId: "rest-1" });
		cartRepo.carts.set(cart.id, cart);

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
					restaurantId: "rest-2",
				}),
			(err: unknown) => {
				assert.ok(err instanceof DifferentRestaurantCartError);
				return true;
			},
		);
	});

	it("should throw CartExpiredError when cart has expired without mutating repository", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart({
			expiresAt: new Date(Date.now() - 10000),
			status: CartStatus.ACTIVE,
		});
		cartRepo.carts.set(cart.id, cart);

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof CartExpiredError);
				return true;
			},
		);

		assert.equal(cartRepo.updatedCarts.size, 0);
	});

	it("should throw CartEmptyError when cart contains no items", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart({ items: [] });
		cartRepo.carts.set(cart.id, cart);

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof CartEmptyError);
				return true;
			},
		);
	});

	it("should propagate RestaurantNotEligibleError when restaurant is blocked or invalid", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		restaurantClient.shouldThrowError = new RestaurantNotEligibleError(
			"Suspended",
		);

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof RestaurantNotEligibleError);
				return true;
			},
		);
	});

	it("should throw MenuItemNotFoundError when catalog item does not exist", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		// catalogPort empty -> item not found
		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof MenuItemNotFoundError);
				return true;
			},
		);
	});

	it("should throw ItemUnavailableError when menu item is not available in catalog", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger",
			price: 100,
			isAvailable: false,
			addons: [],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof ItemUnavailableError);
				return true;
			},
		);
	});

	it("should throw ItemUnavailableError when menu item price is absent from catalog", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart({
			items: [
				new CartItem({
					id: "item-uuid-1",
					cartId: "cart-uuid-1",
					menuItemId: "menu-item-1",
					menuItemName: "Burger",
					variantId: null,
					variantName: null,
					quantity: 1,
					unitPrice: 100,
					totalPrice: 100,
					specialInstructions: null,
					addons: [],
				}),
			],
		});
		cartRepo.carts.set(cart.id, cart);

		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger",
			price: undefined as unknown as number,
			isAvailable: true,
			addons: [],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof ItemUnavailableError);
				return true;
			},
		);
	});

	it("should throw ItemUnavailableError when addon price is absent from catalog", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		const cart = createSampleCart();
		cartRepo.carts.set(cart.id, cart);

		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger",
			price: 100,
			isAvailable: true,
			variant: {
				variantId: "variant-1",
				name: "Double",
				price: 120,
				isAvailable: true,
			},
			addons: [
				{
					addonId: "addon-1",
					name: "Cheese",
					price: undefined as unknown as number,
					isAvailable: true,
				},
			],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "user-uuid-1",
					cartId: cart.id,
				}),
			(err: unknown) => {
				assert.ok(err instanceof ItemUnavailableError);
				return true;
			},
		);
	});

	it("should calculate pricing authoritatively from catalog and ignore tampered cart prices", async () => {
		const cartRepo = new MockCartRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();

		// Cart item has fake / tampered unitPrice = 1 and addon price = 1
		const cart = createSampleCart({
			items: [
				new CartItem({
					id: "item-uuid-1",
					cartId: "cart-uuid-1",
					menuItemId: "menu-item-1",
					menuItemName: "Burger",
					variantId: "variant-1",
					variantName: "Double",
					quantity: 2,
					unitPrice: 1,
					totalPrice: 2,
					specialInstructions: null,
					addons: [
						new CartItemAddon({
							id: "addon-row-1",
							cartItemId: "item-uuid-1",
							addonId: "addon-1",
							addonName: "Cheese",
							price: 1,
						}),
					],
				}),
			],
		});
		cartRepo.carts.set(cart.id, cart);

		// Catalog has authoritative unitPrice = 150 and addon price = 50
		catalogPort.catalog.set("menu-item-1", {
			menuItemId: "menu-item-1",
			name: "Burger Deluxe",
			price: 100,
			isAvailable: true,
			variant: {
				variantId: "variant-1",
				name: "Double Deluxe",
				price: 150,
				isAvailable: true,
			},
			addons: [
				{
					addonId: "addon-1",
					name: "Cheddar Cheese",
					price: 50,
					isAvailable: true,
				},
			],
		});

		const useCase = new GetCheckoutDetailsUseCase(
			cartRepo,
			restaurantClient,
			catalogPort,
		);

		const result = await useCase.execute({
			userId: "user-uuid-1",
			cartId: cart.id,
		});

		// Authoritative line total: (150 + 50) * 2 = 400
		assert.equal(result.items[0]?.unitPrice, 150);
		assert.equal(result.items[0]?.addons[0]?.price, 50);
		assert.equal(result.items[0]?.totalPrice, 400);
		assert.equal(result.subtotal, 400);
	});
});
