import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderItem } from "@domain/entities/order-item.entity.ts";
import { OrderItemAddon } from "@domain/entities/order-item-addon.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart.errors.ts";
import {
	ForbiddenOrderAccessError,
	ForbiddenRestaurantAccessError,
	InvalidOrderStatusTransitionError,
	OrderCancellationNotAllowedError,
} from "@domain/errors/order.errors.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("Order Domain Entity", () => {
	const customerId = "customer-123";
	const restaurantId = "rest-456";

	const createSampleItem = () =>
		new OrderItem({
			id: "item-1",
			orderId: "order-1",
			menuItemId: "menu-1",
			itemName: "Burger",
			quantity: 2,
			unitPrice: 150,
			totalPrice: 350,
			specialInstructions: "No pickles",
			addons: [
				new OrderItemAddon({
					id: "addon-1",
					orderItemId: "item-1",
					addonId: "adn-1",
					addonName: "Cheese",
					price: 25,
				}),
			],
		});

	it("should create an Order entity and calculate totals correctly", () => {
		const item = createSampleItem();
		const order = new Order({
			id: "order-1",
			orderNumber: "ORD-001",
			restaurantId,
			userId: customerId,
			tableNumber: 5,
			orderType: OrderType.DINE_IN,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			priority: 2,
			taxAmount: 18,
			platformFee: 5,
			discountAmount: 10,
			items: [item],
		});

		assert.equal(order.id, "order-1");
		assert.equal(order.orderNumber, "ORD-001");
		assert.equal(order.restaurantId, restaurantId);
		assert.equal(order.userId, customerId);
		assert.equal(order.orderStatus, OrderStatus.PLACED);
		assert.equal(order.paymentStatus, PaymentStatus.PENDING);
		assert.equal(order.priority, 2);
		assert.equal(order.subtotal, 350);
		// grandTotal = 350 + 18 + 5 - 10 = 363
		assert.equal(order.grandTotal, 363);
	});

	it("should throw CartEmptyError when items array is empty", () => {
		assert.throws(
			() =>
				new Order({
					id: "order-1",
					orderNumber: "ORD-001",
					restaurantId,
					userId: customerId,
					orderType: OrderType.TAKEAWAY,
					paymentMode: PaymentMode.COD,
					paymentStatus: PaymentStatus.PENDING,
					orderStatus: OrderStatus.PLACED,
					items: [],
				}),
			(err: unknown) => err instanceof CartEmptyError,
		);
	});

	it("should allow cancellation when status is PLACED", () => {
		const item = createSampleItem();
		const order = new Order({
			id: "order-1",
			orderNumber: "ORD-001",
			restaurantId,
			userId: customerId,
			orderType: OrderType.DINE_IN,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			items: [item],
		});

		order.cancel(customerId, "Customer requested cancellation");

		assert.equal(order.orderStatus, OrderStatus.CANCELLED);
		assert.equal(order.cancellationReason, "Customer requested cancellation");
		assert.ok(order.cancelledAt instanceof Date);
	});

	it("should allow cancellation when status is CONFIRMED", () => {
		const item = createSampleItem();
		const order = new Order({
			id: "order-1",
			orderNumber: "ORD-001",
			restaurantId,
			userId: customerId,
			orderType: OrderType.DINE_IN,
			orderStatus: OrderStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			paymentMode: PaymentMode.ONLINE,
			priority: 2,
			items: [item],
		});

		order.cancel(customerId, null);

		assert.equal(order.orderStatus, OrderStatus.CANCELLED);
		assert.equal(order.cancellationReason, null);
		assert.ok(order.cancelledAt instanceof Date);
	});

	it("should throw ForbiddenOrderAccessError when cancellation requested by different user", () => {
		const item = createSampleItem();
		const order = new Order({
			id: "order-1",
			orderNumber: "ORD-001",
			restaurantId,
			userId: customerId,
			orderType: OrderType.DINE_IN,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			items: [item],
		});

		assert.throws(
			() => order.cancel("different-customer-id", "Changed mind"),
			(err: unknown) =>
				err instanceof ForbiddenOrderAccessError &&
				err.message === ORDER_MESSAGES.ORDER_FORBIDDEN_CANCEL,
		);
	});

	it("should throw OrderCancellationNotAllowedError when order is already CANCELLED", () => {
		const item = createSampleItem();
		const order = new Order({
			id: "order-1",
			orderNumber: "ORD-001",
			restaurantId,
			userId: customerId,
			orderType: OrderType.DINE_IN,
			orderStatus: OrderStatus.CANCELLED,
			paymentStatus: PaymentStatus.PENDING,
			paymentMode: PaymentMode.ONLINE,
			items: [item],
		});

		assert.throws(
			() => order.cancel(customerId, "Double cancel"),
			(err: unknown) =>
				err instanceof OrderCancellationNotAllowedError &&
				err.message === ORDER_MESSAGES.ORDER_ALREADY_CANCELLED,
		);
	});

	it("should throw OrderCancellationNotAllowedError when order is in preparation (PREPARING, READY, SERVED, COMPLETED)", () => {
		const uncancelableStatuses = [
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
			OrderStatus.COMPLETED,
		];

		for (const status of uncancelableStatuses) {
			const item = createSampleItem();
			const order = new Order({
				id: "order-1",
				orderNumber: "ORD-001",
				restaurantId,
				userId: customerId,
				orderType: OrderType.DINE_IN,
				orderStatus: status,
				paymentStatus: PaymentStatus.PAID,
				paymentMode: PaymentMode.ONLINE,
				items: [item],
			});

			assert.throws(
				() => order.cancel(customerId, "Too late"),
				(err: unknown) =>
					err instanceof OrderCancellationNotAllowedError &&
					err.message === ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION,
			);
		}
	});

	describe("updateStatus", () => {
		const createOrderWithStatus = (status: OrderStatus) => {
			const item = createSampleItem();
			return new Order({
				id: "order-1",
				orderNumber: "ORD-001",
				restaurantId,
				userId: customerId,
				orderType: OrderType.DINE_IN,
				orderStatus: status,
				paymentStatus: PaymentStatus.PAID,
				paymentMode: PaymentMode.ONLINE,
				items: [item],
			});
		};

		it("should allow valid transitions: PLACED -> CONFIRMED, CANCELLED", () => {
			const order1 = createOrderWithStatus(OrderStatus.PLACED);
			order1.updateStatus(OrderStatus.CONFIRMED);
			assert.equal(order1.orderStatus, OrderStatus.CONFIRMED);

			const order2 = createOrderWithStatus(OrderStatus.PLACED);
			order2.updateStatus(OrderStatus.CANCELLED);
			assert.equal(order2.orderStatus, OrderStatus.CANCELLED);
			assert.ok(order2.cancelledAt);
		});

		it("should allow valid transitions: CONFIRMED -> PREPARING, CANCELLED", () => {
			const order1 = createOrderWithStatus(OrderStatus.CONFIRMED);
			order1.updateStatus(OrderStatus.PREPARING);
			assert.equal(order1.orderStatus, OrderStatus.PREPARING);

			const order2 = createOrderWithStatus(OrderStatus.CONFIRMED);
			order2.updateStatus(OrderStatus.CANCELLED);
			assert.equal(order2.orderStatus, OrderStatus.CANCELLED);
		});

		it("should allow valid transition: PREPARING -> READY", () => {
			const order = createOrderWithStatus(OrderStatus.PREPARING);
			order.updateStatus(OrderStatus.READY);
			assert.equal(order.orderStatus, OrderStatus.READY);
		});

		it("should allow valid transition: READY -> COMPLETED and READY -> SERVED -> COMPLETED", () => {
			const order1 = createOrderWithStatus(OrderStatus.READY);
			order1.updateStatus(OrderStatus.COMPLETED);
			assert.equal(order1.orderStatus, OrderStatus.COMPLETED);

			const order2 = createOrderWithStatus(OrderStatus.READY);
			order2.updateStatus(OrderStatus.SERVED);
			assert.equal(order2.orderStatus, OrderStatus.SERVED);

			order2.updateStatus(OrderStatus.COMPLETED);
			assert.equal(order2.orderStatus, OrderStatus.COMPLETED);
		});

		it("should reject invalid transitions from PLACED", () => {
			const invalidTargets = [
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.COMPLETED,
				OrderStatus.PLACED,
			];
			for (const target of invalidTargets) {
				const order = createOrderWithStatus(OrderStatus.PLACED);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject invalid transitions from CONFIRMED", () => {
			const invalidTargets = [
				OrderStatus.PLACED,
				OrderStatus.READY,
				OrderStatus.COMPLETED,
				OrderStatus.CONFIRMED,
			];
			for (const target of invalidTargets) {
				const order = createOrderWithStatus(OrderStatus.CONFIRMED);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject invalid transitions from PREPARING", () => {
			const invalidTargets = [
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.COMPLETED,
				OrderStatus.CANCELLED,
				OrderStatus.PREPARING,
			];
			for (const target of invalidTargets) {
				const order = createOrderWithStatus(OrderStatus.PREPARING);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject invalid transitions from READY", () => {
			const invalidTargets = [
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PREPARING,
				OrderStatus.CANCELLED,
				OrderStatus.READY,
			];
			for (const target of invalidTargets) {
				const order = createOrderWithStatus(OrderStatus.READY);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject invalid transitions from SERVED", () => {
			const invalidTargets = [
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.CANCELLED,
				OrderStatus.SERVED,
			];
			for (const target of invalidTargets) {
				const order = createOrderWithStatus(OrderStatus.SERVED);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject all transitions from COMPLETED", () => {
			const allStatuses = Object.values(OrderStatus);
			for (const target of allStatuses) {
				const order = createOrderWithStatus(OrderStatus.COMPLETED);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should reject all transitions from CANCELLED", () => {
			const allStatuses = Object.values(OrderStatus);
			for (const target of allStatuses) {
				const order = createOrderWithStatus(OrderStatus.CANCELLED);
				assert.throws(
					() => order.updateStatus(target),
					(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
				);
			}
		});

		it("should validate restaurant ownership in updateStatus (CQS command)", () => {
			const order = createOrderWithStatus(OrderStatus.PREPARING);

			assert.throws(
				() => order.updateStatus(OrderStatus.READY, "wrong-restaurant"),
				(err: unknown) => err instanceof ForbiddenRestaurantAccessError,
			);

			order.updateStatus(OrderStatus.READY, restaurantId);
			assert.equal(order.orderStatus, OrderStatus.READY);
		});

		it("should expose canTransitionTo as a pure query (CQS query)", () => {
			const order = createOrderWithStatus(OrderStatus.PREPARING);
			assert.equal(order.canTransitionTo(OrderStatus.READY), true);
			assert.equal(order.canTransitionTo(OrderStatus.COMPLETED), false);
			assert.equal(order.canTransitionTo(OrderStatus.PLACED), false);
		});

		it("should expose validateRestaurantAccess as a query/guard", () => {
			const order = createOrderWithStatus(OrderStatus.PREPARING);
			assert.doesNotThrow(() => order.validateRestaurantAccess(restaurantId));
			assert.throws(
				() => order.validateRestaurantAccess("different-rest"),
				(err: unknown) => err instanceof ForbiddenRestaurantAccessError,
			);
		});
	});
});
