import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CancelOrderUseCase } from "@application/use-cases/orders/cancel-order.use-case.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { Order, type OrderProps } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import {
	ForbiddenOrderAccessError,
	OrderCancellationNotAllowedError,
	OrderNotFoundError,
} from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type { CancelledOrderData } from "@domain/types/order-repository.types";

function createTestOrder(props: Partial<OrderProps> = {}): Order {
	return new Order({
		id: props.id ?? "ord-123",
		orderNumber: props.orderNumber ?? "SQ-101",
		restaurantId: props.restaurantId ?? "rest-1",
		userId: props.userId === undefined ? "cust-owner" : props.userId,
		orderType: props.orderType ?? OrderType.DINE_IN,
		paymentMode: props.paymentMode ?? PaymentMode.ONLINE,
		paymentStatus: props.paymentStatus ?? PaymentStatus.PENDING,
		orderStatus: props.orderStatus ?? OrderStatus.PLACED,
		cancellationReason: props.cancellationReason ?? null,
		cancelledAt: props.cancelledAt ?? null,
		items: props.items ?? [
			{
				menuItemId: "item-1",
				itemName: "Burger",
				quantity: 1,
				unitPrice: 100,
			},
		],
		...props,
	});
}

function createMockOrderRepo(options: {
	order?: Order | null;
	cancelledData?: CancelledOrderData;
	onCancel?: (order: Order, previousStatus: OrderStatus) => void;
}): IOrderRepository {
	return {
		create: async () => {
			throw new Error("Not implemented");
		},
		findActiveByUserId: async () => {
			throw new Error("Not implemented");
		},
		getOrdersOverview: async () => {
			throw new Error("Not implemented");
		},
		getCustomerOrderHistory: async () => {
			throw new Error("Not implemented");
		},
		findById: async () => options.order ?? null,
		cancelOrder: async (order, previousStatus) => {
			if (options.onCancel) {
				options.onCancel(order, previousStatus);
			}
			return (
				options.cancelledData ?? {
					orderId: order.id,
					orderNumber: "SQ-101",
					status: "CANCELLED",
					cancellationReason: order.cancellationReason ?? null,
					cancelledAt: order.cancelledAt as Date,
				}
			);
		},
	};
}

describe("CancelOrderUseCase", () => {
	it("should successfully cancel order when status is PLACED", async () => {
		const fixedCancelledAt = new Date("2026-10-06T13:52:00.000Z");
		let capturedOrder: Order | undefined;
		let capturedPreviousStatus: OrderStatus | undefined;

		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.PLACED,
				createdAt: new Date("2026-10-06T13:40:00.000Z"),
			}),
			cancelledData: {
				orderId: "ord-123",
				orderNumber: "SQ-101",
				status: "CANCELLED",
				cancellationReason: "Changed my mind",
				cancelledAt: fixedCancelledAt,
			},
			onCancel: (order, previousStatus) => {
				capturedOrder = order;
				capturedPreviousStatus = previousStatus;
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo);
		const result = await useCase.execute({
			orderId: "ord-123",
			customerId: "cust-owner",
			cancellationReason: "Changed my mind",
		});

		assert.ok(capturedOrder);
		assert.equal(capturedOrder.id, "ord-123");
		assert.equal(capturedOrder.orderStatus, OrderStatus.CANCELLED);
		assert.equal(capturedOrder.cancellationReason, "Changed my mind");
		assert.equal(capturedPreviousStatus, OrderStatus.PLACED);

		assert.deepEqual(result, {
			order_id: "ord-123",
			order_number: "SQ-101",
			status: "CANCELLED",
			cancellation_reason: "Changed my mind",
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should successfully cancel order when status is CONFIRMED", async () => {
		const fixedCancelledAt = new Date("2026-10-06T13:52:00.000Z");
		let capturedOrder: Order | undefined;
		let capturedPreviousStatus: OrderStatus | undefined;

		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-456",
				orderNumber: "SQ-102",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.CONFIRMED,
				createdAt: new Date("2026-10-06T13:40:00.000Z"),
			}),
			cancelledData: {
				orderId: "ord-456",
				orderNumber: "SQ-102",
				status: "CANCELLED",
				cancellationReason: null,
				cancelledAt: fixedCancelledAt,
			},
			onCancel: (order, previousStatus) => {
				capturedOrder = order;
				capturedPreviousStatus = previousStatus;
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo);
		const result = await useCase.execute({
			orderId: "ord-456",
			customerId: "cust-owner",
		});

		assert.ok(capturedOrder);
		assert.equal(capturedOrder.id, "ord-456");
		assert.equal(capturedOrder.orderStatus, OrderStatus.CANCELLED);
		assert.equal(capturedOrder.cancellationReason, null);
		assert.equal(capturedPreviousStatus, OrderStatus.CONFIRMED);

		assert.deepEqual(result, {
			order_id: "ord-456",
			order_number: "SQ-102",
			status: "CANCELLED",
			cancellation_reason: null,
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should preserve null cancellation reason when null is passed", async () => {
		let capturedOrder: Order | undefined;

		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				userId: "cust-owner",
				orderStatus: OrderStatus.PLACED,
			}),
			onCancel: (order) => {
				capturedOrder = order;
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo);
		await useCase.execute({
			orderId: "ord-123",
			customerId: "cust-owner",
			cancellationReason: null,
		});

		assert.ok(capturedOrder);
		assert.equal(capturedOrder.cancellationReason, null);
	});

	it("should throw OrderNotFoundError when order does not exist", async () => {
		const mockRepo = createMockOrderRepo({
			order: null,
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "non-existent-order",
					customerId: "cust-1",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof OrderNotFoundError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_NOT_FOUND);
				return true;
			},
		);
	});

	it("should throw ForbiddenOrderAccessError when customer is not the owner", async () => {
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "original-owner",
				orderStatus: OrderStatus.PLACED,
				createdAt: new Date(),
			}),
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-123",
					customerId: "different-customer",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof ForbiddenOrderAccessError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_FORBIDDEN_CANCEL);
				return true;
			},
		);
	});

	it("should throw OrderCancellationNotAllowedError when status is PREPARING", async () => {
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.PREPARING,
				createdAt: new Date(),
			}),
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-123",
					customerId: "cust-owner",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof OrderCancellationNotAllowedError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION);
				return true;
			},
		);
	});

	it("should throw OrderCancellationNotAllowedError when status is READY", async () => {
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.READY,
				createdAt: new Date(),
			}),
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-123",
					customerId: "cust-owner",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof OrderCancellationNotAllowedError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION);
				return true;
			},
		);
	});

	it("should throw OrderCancellationNotAllowedError when status is COMPLETED", async () => {
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.COMPLETED,
				createdAt: new Date(),
			}),
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-123",
					customerId: "cust-owner",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof OrderCancellationNotAllowedError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_ALREADY_IN_PREPARATION);
				return true;
			},
		);
	});

	it("should throw OrderCancellationNotAllowedError when status is already CANCELLED", async () => {
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.CANCELLED,
				createdAt: new Date(),
			}),
		});

		const useCase = new CancelOrderUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-123",
					customerId: "cust-owner",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof OrderCancellationNotAllowedError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_ALREADY_CANCELLED);
				return true;
			},
		);
	});
});
