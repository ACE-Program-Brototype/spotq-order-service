import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	ActiveQueueDetails,
	ActiveQueueUserResponseDto,
} from "@application/dtos/external/queue-active-user.dto.ts";
import type { RestaurantValidationResultDto } from "@application/dtos/external/restaurant-validation.dto.ts";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import { PlaceOrderUseCase } from "@application/use-cases/orders/place-order.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { OrderPriority } from "@domain/enums/order-priority.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { CartExpiredError } from "@domain/errors/cart-expired.error.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ForbiddenCartAccessError } from "@domain/errors/forbidden-cart-access.error.ts";
import { ItemUnavailableError } from "@domain/errors/item-unavailable.error.ts";
import { MenuItemNotFoundError } from "@domain/errors/menu-item-not-found.error.ts";
import { RestaurantNotEligibleError } from "@domain/errors/restaurant-not-eligible.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";
import type {
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	IOrderRepository,
} from "@domain/repositories/order.repository.interface.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();
	public clearedCartIds: string[] = [];

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

	public async clearCart(cartId: string): Promise<Cart> {
		this.clearedCartIds.push(cartId);
		const existing = this.carts.get(cartId);
		if (!existing) {
			throw new Error("Cart not found");
		}
		return existing;
	}

	public async addItem(_input: AddItemInput): Promise<Cart> {
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
}

class MockOrderRepository implements IOrderRepository {
	public orders: Map<string, Order> = new Map();
	public activeOrderByUserId: Map<string, Order> = new Map();

	public async create(order: Order): Promise<Order> {
		this.orders.set(order.id, order);
		return order;
	}

	public async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	public async findActiveByUserId(
		restaurantId: string,
		userId: string,
	): Promise<Order | null> {
		return this.activeOrderByUserId.get(`${restaurantId}:${userId}`) ?? null;
	}

	public async getOrdersOverview(
		_params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult> {
		throw new Error("Not implemented in test");
	}
}

class MockRestaurantServiceClient implements IRestaurantServiceClient {
	public validationResult: RestaurantValidationResultDto = {
		restaurantId: "rest-1",
		restaurantName: "SpotQ Test Kitchen",
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
		_restaurantId: string,
	): Promise<RestaurantValidationResultDto> {
		if (this.shouldThrowError) {
			throw this.shouldThrowError;
		}
		return this.validationResult;
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
		if (!item) {
			return null;
		}

		return {
			...item,
			variant: variantId
				? item.variant?.variantId === variantId
					? item.variant
					: null
				: null,
			addons: (item.addons ?? []).filter((a) =>
				(addonIds ?? []).includes(a.addonId),
			),
		};
	}
}

class MockQueueServiceClient implements IQueueServiceClient {
	public activeQueue: ActiveQueueUserResponseDto | null = null;

	public async checkUserActiveQueue(
		_restaurantId: string,
		_userId: string,
	): Promise<ActiveQueueUserResponseDto | null> {
		return this.activeQueue;
	}
}

describe("PlaceOrderUseCase", () => {
	const userId = "user-123";
	const restaurantId = "rest-123";
	const cartId = "cart-123";
	const menuItemId = "item-123";
	const addonId = "addon-123";

	function setupFixture() {
		const cartRepo = new MockCartRepository();
		const orderRepo = new MockOrderRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		restaurantClient.validationResult.restaurantId = restaurantId;
		const catalogPort = new MockMenuItemCatalogPort();
		const queueClient = new MockQueueServiceClient();

		catalogPort.catalog.set(menuItemId, {
			menuItemId,
			name: "Paneer Butter Masala",
			price: 250,
			isAvailable: true,
			addons: [
				{
					addonId,
					name: "Extra Butter",
					price: 30,
					isAvailable: true,
				},
			],
		});

		const cart = new Cart({
			id: cartId,
			restaurantId,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [
				new CartItem({
					id: "cart-item-1",
					cartId,
					menuItemId,
					menuItemName: "Paneer Butter Masala",
					quantity: 2,
					unitPrice: 250,
					addons: [
						new CartItemAddon({
							id: "addon-row-1",
							cartItemId: "cart-item-1",
							addonId,
							addonName: "Extra Butter",
							price: 30,
						}),
					],
				}),
			],
		});
		cartRepo.carts.set(cartId, cart);

		const useCase = new PlaceOrderUseCase(
			cartRepo,
			orderRepo,
			restaurantClient,
			catalogPort,
			queueClient,
		);

		return {
			cartRepo,
			orderRepo,
			restaurantClient,
			catalogPort,
			queueClient,
			useCase,
			cart,
		};
	}

	it("throws InvalidPaymentModeError when paymentMode is ONLINE", async () => {
		const { useCase } = setupFixture();

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.ONLINE,
				}),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "InvalidPaymentModeError");
				assert.match(error.message, /feature is coming soon/i);
				return true;
			},
		);
	});

	it("throws CartNotFoundError when cart does not exist", async () => {
		const { useCase, cartRepo } = setupFixture();
		cartRepo.carts.clear();

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId: "non-existent-cart",
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			CartNotFoundError,
		);
	});

	it("throws ForbiddenCartAccessError when cart belongs to another user", async () => {
		const { useCase } = setupFixture();

		await assert.rejects(
			async () =>
				useCase.execute({
					userId: "different-user",
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			ForbiddenCartAccessError,
		);
	});

	it("throws CartExpiredError and updates cart status when cart is expired", async () => {
		const { useCase, cartRepo } = setupFixture();
		const expiredCart = new Cart({
			id: cartId,
			restaurantId,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() - 1000),
			items: [],
		});
		cartRepo.carts.set(cartId, expiredCart);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			CartExpiredError,
		);

		assert.equal(expiredCart.status, CartStatus.EXPIRED);
	});

	it("throws CartEmptyError when cart has no items", async () => {
		const { useCase, cartRepo } = setupFixture();
		const emptyCart = new Cart({
			id: cartId,
			restaurantId,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 86400000),
			items: [],
		});
		cartRepo.carts.set(cartId, emptyCart);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			CartEmptyError,
		);
	});

	it("propagates restaurant validation errors if restaurant is ineligible", async () => {
		const { useCase, restaurantClient } = setupFixture();
		restaurantClient.shouldThrowError = new RestaurantNotEligibleError(
			"Restaurant suspended",
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			RestaurantNotEligibleError,
		);
	});

	it("throws MenuItemNotFoundError if item is not found in catalog", async () => {
		const { useCase, catalogPort } = setupFixture();
		catalogPort.catalog.clear();

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			MenuItemNotFoundError,
		);
	});

	it("throws ItemUnavailableError if item or addon is unavailable in catalog", async () => {
		const { useCase, catalogPort } = setupFixture();
		catalogPort.catalog.set(menuItemId, {
			menuItemId,
			name: "Paneer Butter Masala",
			price: 250,
			isAvailable: false,
			addons: [],
		});

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.PAY_AT_COUNTER,
				}),
			ItemUnavailableError,
		);
	});

	it("Priority 1 (ADDON): assigns priority 1 and DINE_IN when user has uncompleted orders in this restaurant", async () => {
		const { useCase, orderRepo, cartRepo } = setupFixture();

		const activeOrder = new Order({
			orderNumber: "ORD-ACTIVE-001",
			restaurantId,
			userId,
			priority: 2,
			orderType: OrderType.DINE_IN,
			paymentMode: PaymentMode.PAY_AT_COUNTER,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PREPARING,
			items: [
				{
					menuItemId: "item-prev",
					itemName: "Roti",
					quantity: 2,
					unitPrice: 20,
				},
			],
		});
		orderRepo.activeOrderByUserId.set(`${restaurantId}:${userId}`, activeOrder);

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.PAY_AT_COUNTER,
		});

		assert.equal(result.priority, OrderPriority.ADDON);
		assert.equal(result.orderType, OrderType.DINE_IN);
		assert.equal(result.paymentStatus, PaymentStatus.PENDING);
		assert.equal(result.orderStatus, OrderStatus.PLACED);
		assert.equal(cartRepo.clearedCartIds.includes(cartId), true);
	});

	it("Priority 3 (QUEUE): assigns priority 3 and sets queueEntryId and PRE_ORDER when user has active queue entry", async () => {
		const { useCase, queueClient, restaurantClient, cartRepo } = setupFixture();
		restaurantClient.validationResult.canAccessQueueService = true;

		const activeQueueEntry: ActiveQueueDetails = {
			id: "queue-entry-777",
			restaurantId,
			userId,
			queueNumber: "Q-12",
			partySize: 4,
			status: "WAITING",
			position: 2,
			estimatedWaitMinutes: 15,
		};
		queueClient.activeQueue = {
			hasActiveQueue: true,
			queueEntry: activeQueueEntry,
		};

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.PAY_AT_COUNTER,
		});

		assert.equal(result.priority, OrderPriority.QUEUE);
		assert.equal(result.queueEntryId, "queue-entry-777");
		assert.equal(result.orderType, OrderType.PRE_ORDER);
		assert.equal(cartRepo.clearedCartIds.includes(cartId), true);
	});

	it("Priority 2 (NORMAL): assigns priority 2 and DINE_IN when user has no active order and no queue", async () => {
		const { useCase, queueClient, cartRepo, orderRepo } = setupFixture();
		queueClient.activeQueue = null;

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.PAY_AT_COUNTER,
		});

		assert.equal(result.priority, OrderPriority.NORMAL);
		assert.equal(result.queueEntryId, null);
		assert.equal(result.orderType, OrderType.DINE_IN);
		assert.equal(cartRepo.clearedCartIds.includes(cartId), true);

		// Verify order is saved in repository
		const savedOrder = await orderRepo.findById(result.id);
		assert.notEqual(savedOrder, null);
		assert.equal(savedOrder?.priority, OrderPriority.NORMAL);
		assert.equal(savedOrder?.items.length, 1);
		assert.equal(savedOrder?.items[0]?.addons.length, 1);
		assert.equal(savedOrder?.statusHistory.length, 1);
		assert.equal(
			savedOrder?.statusHistory[0]?.currentStatus,
			OrderStatus.PLACED,
		);
	});

	it("finds active cart by userId if cartId is omitted", async () => {
		const { useCase, cartRepo } = setupFixture();

		const result = await useCase.execute({
			userId,
			restaurantId,
			paymentMode: PaymentMode.PAY_AT_COUNTER,
		});

		assert.equal(result.userId, userId);
		assert.equal(cartRepo.clearedCartIds.includes(cartId), true);
	});
});
