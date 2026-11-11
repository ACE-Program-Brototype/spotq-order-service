import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	ProcessPaymentRefundInputDTO,
	ProcessPaymentRefundResponseDTO,
} from "@application/dtos/external/payment-refund.dto.ts";
import type { IPaymentServiceClient } from "@application/ports/external/payment-service.client.port.ts";
import { CancelOrderUseCase } from "@application/use-cases/orders/cancel-order.use-case.ts";
import { ORDER_DEFAULTS } from "@domain/constants/order.constants.ts";
import { Order, type OrderProps } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import {
	ForbiddenOrderAccessError,
	OrderCancellationNotAllowedError,
	OrderNotFoundError,
	PaymentRefundFailedError,
} from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type { CancelledOrderData } from "@domain/types/order-repository.types.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

function createTestOrder(props: Partial<OrderProps> = {}): Order {
	return new Order({
		id: props.id ?? "ord-123",
		orderNumber: props.orderNumber ?? "SQ-101",
		restaurantId: props.restaurantId ?? "rest-1",
		userId: props.userId === undefined ? "cust-owner" : props.userId,
		orderingMode: props.orderingMode ?? OrderingMode.SELF_ORDER,
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
	onCancel?: (
		order: Order,
		previousStatus: OrderStatus,
		auditNote?: string,
	) => void;
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
		findByIdempotencyKey: async () => options.order ?? null,
		updatePaymentReference: async () => {},
		updatePaymentAndOrderStatus: async () => {},
		findByRestaurantAndOrderId: async () => options.order ?? null,
		findByCustomerAndOrderId: async () => options.order ?? null,
		getRestaurantOrders: async () => ({
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			hasNext: false,
		}),
		getStaffOrders: async () => ({
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			limit: 20,
			hasNext: false,
		}),
		cancelOrder: async (order, previousStatus, auditNote) => {
			if (options.onCancel) {
				options.onCancel(order, previousStatus, auditNote);
			}
			return (
				options.cancelledData ?? {
					orderId: order.id,
					orderNumber: order.orderNumber,
					status: order.orderStatus,
					paymentStatus: order.paymentStatus,
					cancellationReason: order.cancellationReason ?? null,
					cancelledAt: order.cancelledAt as Date,
				}
			);
		},
		updateOrderStatus: async () => {
			throw new Error("Not implemented");
		},
	};
}

function createMockPaymentClient(
	options: {
		processRefund?: (
			data: ProcessPaymentRefundInputDTO,
		) => Promise<ProcessPaymentRefundResponseDTO>;
	} = {},
): IPaymentServiceClient {
	return {
		createGatewayOrder: async () => {
			throw new Error("Not implemented");
		},
		processRefund:
			options.processRefund ??
			(async (data: ProcessPaymentRefundInputDTO) => ({
				refundId: "ref-mock-123",
				orderId: data.orderId,
				amountPaise: data.amountPaise,
				currency: "INR",
				status: "PROCESSED",
				processedAt: new Date().toISOString(),
			})),
	};
}

describe("CancelOrderUseCase", () => {
	it("should successfully cancel order when status is PLACED and unpaid", async () => {
		const fixedCancelledAt = new Date("2026-10-06T13:52:00.000Z");
		let capturedOrder: Order | undefined;
		let capturedPreviousStatus: OrderStatus | undefined;
		let refundCalled = false;

		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.PLACED,
				paymentStatus: PaymentStatus.PENDING,
				createdAt: new Date("2026-10-06T13:40:00.000Z"),
			}),
			cancelledData: {
				orderId: "ord-123",
				orderNumber: "SQ-101",
				status: "CANCELLED",
				paymentStatus: "PENDING",
				cancellationReason: "Changed my mind",
				cancelledAt: fixedCancelledAt,
			},
			onCancel: (order, previousStatus) => {
				capturedOrder = order;
				capturedPreviousStatus = previousStatus;
			},
		});

		const mockPaymentClient = createMockPaymentClient({
			processRefund: async () => {
				refundCalled = true;
				throw new Error("Should not be called");
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);
		const result = await useCase.execute({
			orderId: "ord-123",
			customerId: "cust-owner",
			cancellationReason: "Changed my mind",
		});

		assert.equal(refundCalled, false);
		assert.ok(capturedOrder);
		assert.equal(capturedOrder.id, "ord-123");
		assert.equal(capturedOrder.orderStatus, OrderStatus.CANCELLED);
		assert.equal(capturedOrder.cancellationReason, "Changed my mind");
		assert.equal(capturedPreviousStatus, OrderStatus.PLACED);

		assert.deepEqual(result, {
			order_id: "ord-123",
			order_number: "SQ-101",
			status: "CANCELLED",
			payment_status: "PENDING",
			cancellation_reason: "Changed my mind",
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should initiate refund and mark order as REFUNDED when order is PAID", async () => {
		const fixedCancelledAt = new Date("2026-10-06T13:52:00.000Z");
		let capturedOrder: Order | undefined;
		let capturedPreviousStatus: OrderStatus | undefined;
		let capturedAuditNote: string | undefined;
		let capturedRefundPayload: ProcessPaymentRefundInputDTO | undefined;

		const order = createTestOrder({
			id: "ord-777",
			orderNumber: "SQ-777",
			restaurantId: "rest-1",
			userId: "cust-owner",
			orderStatus: OrderStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			grandTotal: 250.5,
			createdAt: new Date("2026-10-06T13:40:00.000Z"),
		});

		const mockRepo = createMockOrderRepo({
			order,
			cancelledData: {
				orderId: "ord-777",
				orderNumber: "SQ-777",
				status: "CANCELLED",
				paymentStatus: "REFUNDED",
				cancellationReason: "Found cheaper elsewhere",
				cancelledAt: fixedCancelledAt,
			},
			onCancel: (ord, previousStatus, auditNote) => {
				capturedOrder = ord;
				capturedPreviousStatus = previousStatus;
				capturedAuditNote = auditNote;
			},
		});

		const mockPaymentClient = createMockPaymentClient({
			processRefund: async (payload) => {
				capturedRefundPayload = payload;
				return {
					refundId: "ref_rzp_999",
					orderId: payload.orderId,
					amountPaise: payload.amountPaise,
					currency: "INR",
					status: "PROCESSED",
					processedAt: new Date().toISOString(),
				};
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);
		const result = await useCase.execute({
			orderId: "ord-777",
			customerId: "cust-owner",
			cancellationReason: "Found cheaper elsewhere",
		});

		assert.ok(capturedRefundPayload);
		assert.equal(capturedRefundPayload.orderId, "ord-777");
		assert.equal(capturedRefundPayload.idempotencyKey, "ord-777");
		assert.equal(capturedRefundPayload.amountPaise, 25050);
		assert.equal(capturedRefundPayload.reason, "Found cheaper elsewhere");
		assert.equal(
			capturedRefundPayload.notes,
			ORDER_DEFAULTS.REFUND_NOTES_TEMPLATE("SQ-777"),
		);

		assert.ok(capturedOrder);
		assert.equal(capturedOrder.orderStatus, OrderStatus.CANCELLED);
		assert.equal(capturedOrder.paymentStatus, PaymentStatus.REFUNDED);
		assert.equal(capturedPreviousStatus, OrderStatus.CONFIRMED);
		assert.equal(
			capturedAuditNote,
			ORDER_DEFAULTS.REFUND_AUDIT_NOTE_TEMPLATE("ref_rzp_999"),
		);

		assert.deepEqual(result, {
			order_id: "ord-777",
			order_number: "SQ-777",
			status: "CANCELLED",
			payment_status: "REFUNDED",
			cancellation_reason: "Found cheaper elsewhere",
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should default cancellation reason to ORDER_DEFAULTS.DEFAULT_CANCELLATION_REASON when omitted", async () => {
		let capturedRefundPayload: ProcessPaymentRefundInputDTO | undefined;

		const order = createTestOrder({
			id: "ord-888",
			orderNumber: "SQ-888",
			userId: "cust-owner",
			orderStatus: OrderStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			grandTotal: 100,
		});

		const mockRepo = createMockOrderRepo({ order });
		const mockPaymentClient = createMockPaymentClient({
			processRefund: async (payload) => {
				capturedRefundPayload = payload;
				return {
					refundId: "ref_123",
					orderId: payload.orderId,
					status: "PROCESSED",
				};
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);
		await useCase.execute({
			orderId: "ord-888",
			customerId: "cust-owner",
		});

		assert.ok(capturedRefundPayload);
		assert.equal(
			capturedRefundPayload.reason,
			ORDER_DEFAULTS.DEFAULT_CANCELLATION_REASON,
		);
		assert.equal(
			capturedRefundPayload.notes,
			ORDER_DEFAULTS.REFUND_NOTES_TEMPLATE("SQ-888"),
		);
	});

	it("should abort cancellation and propagate error when refund fails, without updating repository", async () => {
		let cancelOrderCalled = false;

		const order = createTestOrder({
			id: "ord-888",
			orderNumber: "SQ-888",
			restaurantId: "rest-1",
			userId: "cust-owner",
			orderStatus: OrderStatus.CONFIRMED,
			paymentStatus: PaymentStatus.PAID,
			grandTotal: 150,
			createdAt: new Date("2026-10-06T13:40:00.000Z"),
		});

		const mockRepo = createMockOrderRepo({
			order,
			onCancel: () => {
				cancelOrderCalled = true;
			},
		});

		const mockPaymentClient = createMockPaymentClient({
			processRefund: async () => {
				throw new PaymentRefundFailedError(
					"Payment service gateway unavailable",
				);
			},
		});

		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

		await assert.rejects(
			async () => {
				await useCase.execute({
					orderId: "ord-888",
					customerId: "cust-owner",
					cancellationReason: "Late delivery",
				});
			},
			(err: Error) => {
				assert.ok(err instanceof PaymentRefundFailedError);
				assert.equal(err.message, "Payment service gateway unavailable");
				return true;
			},
		);

		assert.equal(cancelOrderCalled, false);
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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);
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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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

		const mockPaymentClient = createMockPaymentClient();
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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
		let refundAttempted = false;
		const mockRepo = createMockOrderRepo({
			order: createTestOrder({
				id: "ord-123",
				orderNumber: "SQ-101",
				restaurantId: "rest-1",
				userId: "cust-owner",
				orderStatus: OrderStatus.CANCELLED,
				paymentStatus: PaymentStatus.PENDING,
				createdAt: new Date(),
			}),
		});

		const mockPaymentClient = createMockPaymentClient({
			processRefund: async () => {
				refundAttempted = true;
				return {
					refundId: "ref-1",
					orderId: "ord-123",
					status: "PROCESSED",
				};
			},
		});
		const useCase = new CancelOrderUseCase(mockRepo, mockPaymentClient);

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
		assert.equal(refundAttempted, false);
	});
});
