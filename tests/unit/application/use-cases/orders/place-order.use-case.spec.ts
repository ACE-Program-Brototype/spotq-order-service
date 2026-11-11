import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	ProcessPaymentRefundInputDTO,
	ProcessPaymentRefundResponseDTO,
} from "@application/dtos/external/payment-refund.dto.ts";
import type {
	CreateOrderPaymentInputDTO,
	CreateOrderPaymentResponseDTO,
} from "@application/dtos/external/payment-service.dto.ts";
import type {
	ActiveQueueDetails,
	ActiveQueueUserResponseDTO,
} from "@application/dtos/external/queue-active-user.dto.ts";
import type { RestaurantValidationResultDTO } from "@application/dtos/external/restaurant-validation.dto.ts";
import type {
	CatalogItemDetails,
	IMenuItemCatalogPort,
} from "@application/ports/external/menu-item-catalog.port.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import { PlaceOrderUseCase } from "@application/use-cases/orders/place-order.use-case.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import {
	CartEmptyError,
	CartExpiredError,
	CartNotFoundError,
	ForbiddenCartAccessError,
} from "@domain/errors/cart.errors.ts";
import {
	ActiveQueueEntryRequiredError,
	InvalidPaymentModeError,
	OrderingModeNotSupportedError,
} from "@domain/errors/order.errors.ts";
import type {
	AddItemInput,
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	GetRestaurantOrdersRepoResult,
	GetStaffOrdersRepoResult,
} from "@domain/types/order-repository.types.ts";

class MockCartRepository implements ICartRepository {
	public carts: Map<string, Cart> = new Map();
	public clearedCartIds: string[] = [];

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
		const cart = this.carts.get(cartId);
		if (!cart) {
			return null;
		}
		if (data.status !== undefined) {
			(cart as { status: CartStatus }).status = data.status;
		}
		return cart;
	}

	public async clearCart(cartId: string): Promise<Cart> {
		this.clearedCartIds.push(cartId);
		const cart = this.carts.get(cartId);
		if (cart) {
			(cart as { items: CartItem[] }).items = [];
			return cart;
		}
		throw new Error("Cart not found in mock");
	}

	public async addItem(_input: AddItemInput): Promise<Cart> {
		throw new Error("Not implemented in test");
	}

	public async replaceCartItemsBatch(): Promise<Cart> {
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
	public clearedCartIds: string[] = [];

	public async create(order: Order, cartIdToClear?: string): Promise<Order> {
		this.orders.set(order.id, order);
		if (cartIdToClear) {
			this.clearedCartIds.push(cartIdToClear);
		}
		return order;
	}

	public async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	public async findByIdempotencyKey(key: string): Promise<Order | null> {
		for (const order of this.orders.values()) {
			if (order.idempotencyKey === key) {
				return order;
			}
		}
		return null;
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

	public async getCustomerOrderHistory(
		_params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult> {
		throw new Error("Not implemented in test");
	}

	public async cancelOrder(
		_order: Order,
		_previousStatus: OrderStatus,
	): Promise<CancelledOrderData> {
		throw new Error("Not implemented in test");
	}

	public async updatePaymentReference(
		orderId: string,
		paymentId: string,
	): Promise<void> {
		const order = this.orders.get(orderId);
		if (order) {
			order.associatePayment(paymentId);
		}
	}

	public async updatePaymentAndOrderStatus(
		orderId: string,
		paymentStatus: PaymentStatus,
		_orderStatus?: OrderStatus,
		reason?: string,
		_paymentId?: string,
	): Promise<void> {
		const order = this.orders.get(orderId);
		if (order) {
			if (paymentStatus === PaymentStatus.FAILED) {
				order.markPaymentFailed(reason);
			} else if (paymentStatus === PaymentStatus.PAID) {
				order.markAsPaid();
			}
		}
	}

	public async findByRestaurantAndOrderId(
		_restaurantId: string,
		_orderId: string,
	): Promise<Order | null> {
		return null;
	}

	public async findByCustomerAndOrderId(
		_customerId: string,
		_orderId: string,
	): Promise<Order | null> {
		return null;
	}

	public async getRestaurantOrders(): Promise<GetRestaurantOrdersRepoResult> {
		return {
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			hasNext: false,
		};
	}

	public async getStaffOrders(): Promise<GetStaffOrdersRepoResult> {
		return {
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			limit: 20,
			hasNext: false,
		};
	}

	public async updateOrderStatus(
		_order: Order,
		_previousStatus: OrderStatus,
		_actorId: string,
		_notes?: string | null,
	): Promise<Order> {
		throw new Error("Not implemented in test");
	}
}

class MockRestaurantServiceClient implements IRestaurantServiceClient {
	public validationResult: RestaurantValidationResultDTO = {
		restaurantId: "rest-1",
		restaurantName: "SpotQ Test Kitchen",
		verificationStatus: "ACTIVE",
		isBlocked: false,
		blockReason: null,
		isSubscriptionActive: true,
		subscriptionPlanCode: "SELF_PRO",
		subscriptionEndsAt: "2027-01-01T00:00:00.000Z",
		canAccessQueueService: true,
	};

	public async validateRestaurant(
		_restaurantId: string,
	): Promise<RestaurantValidationResultDTO> {
		return this.validationResult;
	}
}

class MockMenuItemCatalogPort implements IMenuItemCatalogPort {
	public catalog: Map<string, CatalogItemDetails> = new Map();

	public async getItemDetails(
		_restaurantId: string,
		menuItemId: string,
	): Promise<CatalogItemDetails | null> {
		return this.catalog.get(menuItemId) ?? null;
	}
}

class MockQueueServiceClient implements IQueueServiceClient {
	public activeQueue: ActiveQueueUserResponseDTO | null = null;

	public async checkUserActiveQueue(
		_restaurantId: string,
		_userId: string,
	): Promise<ActiveQueueUserResponseDTO | null> {
		return this.activeQueue;
	}
}

class MockPaymentServiceClient implements IPaymentServiceClient {
	public paymentDraft: CreateOrderPaymentResponseDTO = {
		paymentId: "pay-123456",
		orderId: "order-test-1",
		razorpayOrderId: "order_rzp_123",
		keyId: "rzp_test_key",
		amountPaise: 48300,
		currency: "INR",
	};
	public shouldFail = false;
	public failureError: Error = new Error("Payment gateway service unavailable");

	public async createGatewayOrder(
		_data: CreateOrderPaymentInputDTO,
	): Promise<CreateOrderPaymentResponseDTO> {
		if (this.shouldFail) {
			throw this.failureError;
		}
		return this.paymentDraft;
	}

	public async processRefund(
		_data: ProcessPaymentRefundInputDTO,
	): Promise<ProcessPaymentRefundResponseDTO> {
		throw new Error("Not implemented");
	}
}

describe("PlaceOrderUseCase", () => {
	const userId = "user-101";
	const restaurantId = "rest-1";
	const cartId = "cart-555";
	const menuItemId = "item-pizza";
	const addonId = "addon-extra-cheese";

	function setupFixture() {
		const cartRepo = new MockCartRepository();
		const orderRepo = new MockOrderRepository();
		const restaurantClient = new MockRestaurantServiceClient();
		const catalogPort = new MockMenuItemCatalogPort();
		const queueClient = new MockQueueServiceClient();
		const paymentClient = new MockPaymentServiceClient();

		const cartItem = new CartItem({
			id: "cart-item-1",
			cartId,
			menuItemId,
			menuItemName: "Margherita Pizza",
			quantity: 2,
			unitPrice: 200,
			totalPrice: 460,
			specialInstructions: "Well done",
			addons: [
				new CartItemAddon({
					id: "addon-row-1",
					cartItemId: "cart-item-1",
					addonId,
					addonName: "Extra Cheese",
					price: 30,
				}),
			],
		});

		const cart = new Cart({
			id: cartId,
			restaurantId,
			userId,
			status: CartStatus.ACTIVE,
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			items: [cartItem],
		});

		cartRepo.carts.set(cartId, cart);

		catalogPort.catalog.set(menuItemId, {
			menuItemId,
			name: "Margherita Pizza Fresh",
			price: 200,
			preparationTime: 20,
			isAvailable: true,
			addons: [
				{
					addonId,
					name: "Extra Cheese Fresh",
					price: 30,
					isAvailable: true,
				},
			],
		});

		const useCase = new PlaceOrderUseCase(
			cartRepo,
			orderRepo,
			restaurantClient,
			catalogPort,
			queueClient,
			paymentClient,
		);

		return {
			cartRepo,
			orderRepo,
			restaurantClient,
			catalogPort,
			queueClient,
			paymentClient,
			useCase,
			cart,
		};
	}

	it("throws InvalidPaymentModeError when paymentMode is not ONLINE", async () => {
		const { useCase } = setupFixture();

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: "PAY_AT_COUNTER" as unknown as PaymentMode,
				}),
			InvalidPaymentModeError,
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
					paymentMode: PaymentMode.ONLINE,
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
					paymentMode: PaymentMode.ONLINE,
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
					paymentMode: PaymentMode.ONLINE,
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
			expiresAt: new Date(Date.now() + 60 * 60 * 1000),
			items: [],
		});
		cartRepo.carts.set(cartId, emptyCart);

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.ONLINE,
				}),
			CartEmptyError,
		);
	});

	it("successfully places SELF_ORDER and sets restaurantPlan", async () => {
		const { useCase } = setupFixture();

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.SELF_ORDER);
		assert.equal(result.restaurantPlan, RestaurantPlan.SELF_PRO);
	});

	it("returns existing order when idempotencyKey matches an existing order", async () => {
		const { useCase } = setupFixture();
		const idempotencyKey = "unique-key-123";

		const firstOrder = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			idempotencyKey,
			paymentMode: PaymentMode.ONLINE,
		});

		const secondOrder = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			idempotencyKey,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(secondOrder.id, firstOrder.id);
		assert.equal(secondOrder.orderNumber, firstOrder.orderNumber);
		assert.deepEqual(secondOrder.paymentDraft, firstOrder.paymentDraft);
	});

	it("automatically sets QUEUE_ORDER when customer has active queue entry and plan is QUEUE_PRO", async () => {
		const { useCase, queueClient, restaurantClient } = setupFixture();
		restaurantClient.validationResult.subscriptionPlanCode = "QUEUE_PRO";
		const activeQueueEntry: ActiveQueueDetails = {
			queueEntryId: "queue-entry-auto-2",
			restaurantId,
			userId,
			queueNumber: "Q-99",
			partySize: 2,
			status: "WAITING",
			position: 1,
			estimatedWaitMinutes: 5,
		};
		queueClient.activeQueue = {
			hasActiveQueue: true,
			queueEntry: activeQueueEntry,
		};

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.QUEUE_ORDER);
		assert.equal(result.queueEntryId, "queue-entry-auto-2");
	});

	it("successfully places a SELF_ORDER and computes authoritative totals and estimatedReadyAt", async () => {
		const { useCase, orderRepo, cartRepo } = setupFixture();

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.SELF_ORDER);
		assert.equal(result.queueEntryId, null);
		assert.equal(result.paymentMode, PaymentMode.ONLINE);
		assert.equal(result.paymentStatus, PaymentStatus.PENDING);
		assert.equal(result.orderStatus, OrderStatus.PLACED);
		assert.equal(result.paymentId, "pay-123456");
		assert.notEqual(result.paymentDraft, null);
		assert.equal(result.paymentDraft?.paymentId, "pay-123456");
		assert.equal(result.paymentDraft?.razorpayOrderId, "order_rzp_123");
		assert.equal(cartRepo.clearedCartIds.includes(cartId), true);

		// subtotal = (200 + 30) * 2 = 460
		assert.equal(result.subtotal, 460);
		// taxAmount = 460 * 5% = 23
		assert.equal(result.taxAmount, 23);
		// grandTotal = 460 + 23 = 483
		assert.equal(result.grandTotal, 483);
		assert.notEqual(result.estimatedReadyAt, null);

		const saved = await orderRepo.findById(result.id);
		assert.notEqual(saved, null);
		assert.equal(saved?.orderingMode, OrderingMode.SELF_ORDER);
		assert.equal(saved?.paymentId, "pay-123456");
	});

	it("orchestrates Saga compensation when payment gateway draft creation fails", async () => {
		const { useCase, paymentClient } = setupFixture();
		paymentClient.shouldFail = true;

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.ONLINE,
				}),
			/Payment gateway service unavailable/,
		);
	});

	it("successfully places a QUEUE_ORDER when customer has active queue entry", async () => {
		const { useCase, queueClient, restaurantClient } = setupFixture();
		restaurantClient.validationResult.subscriptionPlanCode = "QUEUE_PRO";

		const activeQueueEntry: ActiveQueueDetails = {
			queueEntryId: "queue-entry-999",
			restaurantId,
			userId,
			queueNumber: "Q-15",
			partySize: 2,
			status: "WAITING",
			position: 1,
			estimatedWaitMinutes: 10,
		};
		queueClient.activeQueue = {
			hasActiveQueue: true,
			queueEntry: activeQueueEntry,
		};

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.QUEUE_ORDER);
		assert.equal(result.queueEntryId, "queue-entry-999");
		assert.equal(result.restaurantPlan, RestaurantPlan.QUEUE_PRO);
		assert.equal(result.paymentMode, PaymentMode.ONLINE);
		assert.equal(result.paymentStatus, PaymentStatus.PENDING);
		assert.equal(result.orderStatus, OrderStatus.PLACED);
	});

	it("automatically determines QUEUE_ORDER when orderingMode is omitted and user has active queue on QUEUE_PRO plan", async () => {
		const { useCase, queueClient, restaurantClient } = setupFixture();
		restaurantClient.validationResult.subscriptionPlanCode = "QUEUE_PRO";

		const activeQueueEntry: ActiveQueueDetails = {
			queueEntryId: "queue-entry-auto-1",
			restaurantId,
			userId,
			queueNumber: "Q-20",
			partySize: 2,
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
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.QUEUE_ORDER);
		assert.equal(result.queueEntryId, "queue-entry-auto-1");
	});

	it("throws ActiveQueueEntryRequiredError when restaurant plan is QUEUE_PRO and customer is not in queue", async () => {
		const { useCase, queueClient, restaurantClient } = setupFixture();
		restaurantClient.validationResult.subscriptionPlanCode = "QUEUE_PRO";
		queueClient.activeQueue = {
			hasActiveQueue: false,
			queueEntry: null,
		};

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.ONLINE,
				}),
			ActiveQueueEntryRequiredError,
		);
	});

	it("throws OrderingModeNotSupportedError when restaurant plan does not support digital ordering", async () => {
		const { useCase, restaurantClient } = setupFixture();
		restaurantClient.validationResult.subscriptionPlanCode = "INVALID_PLAN";

		await assert.rejects(
			async () =>
				useCase.execute({
					userId,
					restaurantId,
					cartId,
					paymentMode: PaymentMode.ONLINE,
				}),
			OrderingModeNotSupportedError,
		);
	});

	it("automatically determines SELF_ORDER when orderingMode is omitted and user has no active queue", async () => {
		const { useCase, queueClient } = setupFixture();
		queueClient.activeQueue = {
			hasActiveQueue: false,
			queueEntry: null,
		};

		const result = await useCase.execute({
			userId,
			restaurantId,
			cartId,
			paymentMode: PaymentMode.ONLINE,
		});

		assert.equal(result.orderingMode, OrderingMode.SELF_ORDER);
		assert.equal(result.queueEntryId, null);
	});
});
