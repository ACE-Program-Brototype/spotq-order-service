import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	GetRestaurantOrdersRepoParams,
	GetRestaurantOrdersRepoResult,
	GetStaffOrdersRepoResult,
} from "@domain/types/order-repository.types.ts";
import { OrderPaymentEventsConsumer } from "@infrastructure/messaging/order-payment-events.consumer.ts";
import type { RabbitMQService } from "@infrastructure/rabbitmq/rabbitmq.service.ts";
import { PAYMENT_EVENTS, QUEUES } from "@shared/constants/events.constants.ts";
import type {
	ConsumeOptions,
	MessageHandler,
} from "@spotq-org/rabbitmq-client";

class MockRabbitMQService {
	public registeredQueue: string | null = null;
	public registeredHandler: MessageHandler<unknown> | null = null;
	public publishedMessages: { queue: string; message: unknown }[] = [];

	public async consumeFromQueue<T = unknown>(
		queue: string,
		handler: MessageHandler<T>,
		_options?: ConsumeOptions,
	): Promise<void> {
		this.registeredQueue = queue;
		this.registeredHandler = handler as MessageHandler<unknown>;
	}

	public async publishToQueue<T = unknown>(
		queue: string,
		message: T,
	): Promise<boolean> {
		this.publishedMessages.push({ queue, message });
		return true;
	}
}

class MockOrderRepository implements IOrderRepository {
	public orders: Map<string, Order> = new Map();
	public paymentStatusUpdates: {
		orderId: string;
		paymentStatus: PaymentStatus;
		orderStatus?: OrderStatus | undefined;
		reason?: string | undefined;
		paymentId?: string | undefined;
	}[] = [];
	public paymentReferences: { orderId: string; paymentId: string }[] = [];

	public async create(order: Order): Promise<Order> {
		this.orders.set(order.id, order);
		return order;
	}

	public async findById(id: string): Promise<Order | null> {
		return this.orders.get(id) ?? null;
	}

	public async findByIdempotencyKey(_key: string): Promise<Order | null> {
		return null;
	}

	public async findActiveByUserId(
		_restaurantId: string,
		_userId: string,
	): Promise<Order | null> {
		return null;
	}

	public async getOrdersOverview(
		_params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult> {
		throw new Error("Not implemented");
	}

	public async getCustomerOrderHistory(
		_params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult> {
		throw new Error("Not implemented");
	}

	public async cancelOrder(
		_order: Order,
		_previousStatus: OrderStatus,
	): Promise<CancelledOrderData> {
		throw new Error("Not implemented");
	}

	public async updatePaymentReference(
		orderId: string,
		paymentId: string,
	): Promise<void> {
		this.paymentReferences.push({ orderId, paymentId });
		const order = this.orders.get(orderId);
		if (order) {
			order.associatePayment(paymentId);
		}
	}

	public async updatePaymentAndOrderStatus(
		orderId: string,
		paymentStatus: PaymentStatus,
		orderStatus?: OrderStatus,
		reason?: string,
		paymentId?: string,
	): Promise<void> {
		this.paymentStatusUpdates.push({
			orderId,
			paymentStatus,
			orderStatus,
			reason,
			paymentId,
		});
		const order = this.orders.get(orderId);
		if (order) {
			if (paymentId) {
				order.associatePayment(paymentId);
			}
			if (paymentStatus === PaymentStatus.PAID) {
				order.markAsPaid(paymentId);
			} else if (paymentStatus === PaymentStatus.FAILED) {
				order.markPaymentFailed(reason);
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

	public async getRestaurantOrders(
		_params: GetRestaurantOrdersRepoParams,
	): Promise<GetRestaurantOrdersRepoResult> {
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
		order: Order,
		_previousStatus: OrderStatus,
		_actorId: string,
		_notes?: string | null,
	): Promise<Order> {
		return order;
	}

	public async getRestaurantOrderAnalytics(): Promise<never> {
		throw new Error("Not implemented in test");
	}

	public async getRestaurantProductAnalytics(): Promise<never> {
		throw new Error("Not implemented in test");
	}
}

describe("OrderPaymentEventsConsumer", () => {
	const orderId = "00000000-0000-0000-0000-000000000001";

	function createTestOrder(
		props?: Partial<ConstructorParameters<typeof Order>[0]>,
	) {
		return new Order({
			id: orderId,
			orderNumber: "ORD-12345",
			restaurantId: "rest-1",
			restaurantName: "SpotQ Test Kitchen",
			userId: "user-1",
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			items: [
				{
					menuItemId: "item-1",
					itemName: "Burger",
					quantity: 1,
					unitPrice: 150,
					addons: [],
				},
			],
			...props,
		});
	}

	function setupFixture() {
		const rmqService = new MockRabbitMQService();
		const orderRepo = new MockOrderRepository();
		const consumer = new OrderPaymentEventsConsumer(
			rmqService as unknown as RabbitMQService,
			orderRepo,
		);

		return { rmqService, orderRepo, consumer };
	}

	it("registers consumer for order-events queue on start()", async () => {
		const { consumer, rmqService } = setupFixture();

		await consumer.start();

		assert.equal(rmqService.registeredQueue, QUEUES.ORDER_EVENTS);
		assert.notEqual(rmqService.registeredHandler, null);
	});

	it("handles payment.order.captured: transitions order to PAID and CONFIRMED and publishes order.payment.invoice event", async () => {
		const { consumer, orderRepo, rmqService } = setupFixture();
		const order = createTestOrder();
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-1",
			eventType: PAYMENT_EVENTS.ORDER_CAPTURED,
			orderId,
			paymentId: "pay_rzp_999",
			amountPaise: 15000,
			currency: "INR",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 1);
		assert.equal(orderRepo.paymentStatusUpdates[0]?.orderId, orderId);
		assert.equal(
			orderRepo.paymentStatusUpdates[0]?.paymentStatus,
			PaymentStatus.PAID,
		);
		assert.equal(
			orderRepo.paymentStatusUpdates[0]?.orderStatus,
			OrderStatus.CONFIRMED,
		);
		assert.equal(orderRepo.paymentStatusUpdates[0]?.paymentId, "pay_rzp_999");

		assert.equal(order.paymentStatus, PaymentStatus.PAID);
		assert.equal(order.orderStatus, OrderStatus.CONFIRMED);
		assert.equal(order.paymentId, "pay_rzp_999");

		// Verify order.payment.invoice event published with orderData object
		assert.equal(rmqService.publishedMessages.length, 1);
		const published = rmqService.publishedMessages[0];
		assert.equal(published?.queue, QUEUES.PAYMENT_EVENTS);
		const publishedEvent = published?.message as {
			eventType: string;
			orderData: {
				orderId: string;
				paymentId: string | null;
				paymentStatus: string;
				orderStatus: string;
				financials: {
					subtotal: number;
					grandTotal: number;
					amountPaise: number;
				};
				items: { itemName: string; quantity: number; unitPrice: number }[];
			};
		};
		assert.equal(publishedEvent.eventType, "order.payment.invoice");
		assert.notEqual(publishedEvent.orderData, undefined);
		assert.equal(publishedEvent.orderData.orderId, orderId);
		assert.equal(publishedEvent.orderData.paymentId, "pay_rzp_999");
		assert.equal(publishedEvent.orderData.paymentStatus, PaymentStatus.PAID);
		assert.equal(publishedEvent.orderData.orderStatus, OrderStatus.CONFIRMED);
		assert.equal(publishedEvent.orderData.financials.subtotal, 150);
		assert.equal(publishedEvent.orderData.financials.grandTotal, 150);
		assert.equal(publishedEvent.orderData.financials.amountPaise, 15000);
		assert.equal(publishedEvent.orderData.items.length, 1);
		assert.equal(publishedEvent.orderData.items[0]?.itemName, "Burger");
		assert.equal(publishedEvent.orderData.items[0]?.quantity, 1);
		assert.equal(publishedEvent.orderData.items[0]?.unitPrice, 150);
	});

	it("does not capture payment if order is already CANCELLED", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder({
			orderStatus: OrderStatus.CANCELLED,
			paymentStatus: PaymentStatus.PENDING,
		});
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-cancel",
			eventType: PAYMENT_EVENTS.ORDER_CAPTURED,
			orderId,
			paymentId: "pay_rzp_late",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
		assert.equal(order.orderStatus, OrderStatus.CANCELLED);
		assert.notEqual(order.paymentStatus, PaymentStatus.PAID);
	});

	it("does not capture payment if order paymentStatus is already FAILED", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder({
			orderStatus: OrderStatus.PLACED,
			paymentStatus: PaymentStatus.FAILED,
		});
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-failed",
			eventType: PAYMENT_EVENTS.ORDER_CAPTURED,
			orderId,
			paymentId: "pay_rzp_late2",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
		assert.equal(order.paymentStatus, PaymentStatus.FAILED);
	});

	it("handles payment.order.captured idempotency: does nothing if already PAID and CONFIRMED", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder({
			paymentStatus: PaymentStatus.PAID,
			orderStatus: OrderStatus.CONFIRMED,
		});
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-1",
			eventType: PAYMENT_EVENTS.ORDER_CAPTURED,
			orderId,
			paymentId: "pay_rzp_999",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
		assert.equal(orderRepo.paymentReferences.length, 0);
	});

	it("handles payment.order.failed: transitions order to FAILED and CANCELLED", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder();
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-2",
			eventType: PAYMENT_EVENTS.ORDER_FAILED,
			orderId,
			paymentId: "pay_rzp_failed",
			failureReason: "Card declined by issuing bank",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 1);
		assert.equal(
			orderRepo.paymentStatusUpdates[0]?.paymentStatus,
			PaymentStatus.FAILED,
		);
		assert.equal(
			orderRepo.paymentStatusUpdates[0]?.orderStatus,
			OrderStatus.CANCELLED,
		);
		assert.equal(
			orderRepo.paymentStatusUpdates[0]?.reason,
			"Card declined by issuing bank",
		);

		assert.equal(order.paymentStatus, PaymentStatus.FAILED);
		assert.equal(order.orderStatus, OrderStatus.CANCELLED);
	});

	it("handles payment.order.failed idempotency: does nothing if already FAILED and CANCELLED", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder({
			paymentStatus: PaymentStatus.FAILED,
			orderStatus: OrderStatus.CANCELLED,
		});
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-2",
			eventType: PAYMENT_EVENTS.ORDER_FAILED,
			orderId,
			failureReason: "Card declined",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
	});

	it("does not cancel order on payment.order.failed if order is already marked as PAID", async () => {
		const { consumer, orderRepo } = setupFixture();
		const order = createTestOrder({
			paymentStatus: PaymentStatus.PAID,
			orderStatus: OrderStatus.CONFIRMED,
		});
		orderRepo.orders.set(orderId, order);

		const eventPayload = {
			eventId: "evt-3",
			eventType: PAYMENT_EVENTS.ORDER_FAILED,
			orderId,
			failureReason: "Late failure notification",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
		assert.equal(order.paymentStatus, PaymentStatus.PAID);
		assert.equal(order.orderStatus, OrderStatus.CONFIRMED);
	});

	it("gracefully handles unknown orderId without throwing", async () => {
		const { consumer, orderRepo } = setupFixture();

		const eventPayload = {
			eventId: "evt-4",
			eventType: PAYMENT_EVENTS.ORDER_CAPTURED,
			orderId: "00000000-0000-0000-0000-999999999999",
		};

		await consumer.handleMessage(eventPayload);

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
	});

	it("gracefully ignores unparseable or unknown event types", async () => {
		const { consumer, orderRepo } = setupFixture();

		await consumer.handleMessage({ invalid: true });
		await consumer.handleMessage({
			eventType: "restaurant.menu.updated",
			orderId,
		});

		assert.equal(orderRepo.paymentStatusUpdates.length, 0);
	});
});
