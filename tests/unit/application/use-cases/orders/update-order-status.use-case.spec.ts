import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { UpdateOrderStatusUseCase } from "@application/use-cases/orders/update-order-status.use-case.ts";
import { ORDER_DEFAULTS } from "@domain/constants/order.constants.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import {
	ForbiddenRestaurantAccessError,
	InvalidOrderStatusTransitionError,
	OrderNotFoundError,
	OrderStatusConflictError,
} from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";

function createSampleOrder(overrides: {
	id?: string;
	restaurantId?: string;
	status?: OrderStatus;
}): Order {
	return new Order({
		id: overrides.id ?? "order-uuid-1",
		orderNumber: "SQ-101",
		restaurantId: overrides.restaurantId ?? "rest-uuid-1",
		restaurantName: "SpotQ Test Kitchen",
		userId: "user-uuid-1",
		userName: "John Doe",
		userPhone: "9876543210",
		tableNumber: 4,
		orderingMode: OrderingMode.SELF_ORDER,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PENDING,
		orderStatus: overrides.status ?? OrderStatus.PLACED,
		subtotal: 300,
		taxAmount: 15,
		platformFee: 5,
		discountAmount: 0,
		grandTotal: 320,
		items: [
			{
				id: "item-1",
				orderId: overrides.id ?? "order-uuid-1",
				menuItemId: "menu-1",
				itemName: "Burger",
				quantity: 2,
				unitPrice: 150,
				totalPrice: 300,
				addons: [],
			},
		],
	});
}

function createMockOrderRepo(overrides: {
	order?: Order | null;
	onUpdate?: (
		order: Order,
		previousStatus: OrderStatus,
		actorId: string,
		notes?: string | null,
	) => void;
	conflict?: boolean;
}): IOrderRepository {
	return {
		create: async () => {
			throw new Error("Not implemented");
		},
		findById: async (id: string) => {
			if (overrides.order === null) return null;
			return overrides.order ?? createSampleOrder({ id });
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
		cancelOrder: async () => {
			throw new Error("Not implemented");
		},
		getRestaurantOrders: async () => {
			throw new Error("Not implemented");
		},
		findByRestaurantAndOrderId: async () => {
			throw new Error("Not implemented");
		},
		findByIdempotencyKey: async () => null,
		updatePaymentReference: async () => {},
		updatePaymentAndOrderStatus: async () => {},
		updateOrderStatus: async (order, previousStatus, actorId, notes) => {
			if (overrides.conflict) {
				throw new OrderStatusConflictError();
			}
			if (overrides.onUpdate) {
				overrides.onUpdate(order, previousStatus, actorId, notes);
			}
			return order;
		},
	};
}

describe("UpdateOrderStatusUseCase", () => {
	it("should successfully update status from PLACED to CONFIRMED", async () => {
		let capturedPrev: OrderStatus | undefined;
		let capturedActor: string | undefined;
		let capturedNotes: string | null | undefined;

		const order = createSampleOrder({ status: OrderStatus.PLACED });
		const repo = createMockOrderRepo({
			order,
			onUpdate: (_ord, prev, actor, notes) => {
				capturedPrev = prev;
				capturedActor = actor;
				capturedNotes = notes;
			},
		});

		const useCase = new UpdateOrderStatusUseCase(repo);
		const result = await useCase.execute({
			orderId: order.id,
			status: OrderStatus.CONFIRMED,
			restaurantId: "rest-uuid-1",
			actorId: "staff-uuid-1",
		});

		assert.equal(result.orderId, order.id);
		assert.equal(result.previousStatus, OrderStatus.PLACED);
		assert.equal(result.status, OrderStatus.CONFIRMED);
		assert.equal(result.orderStatus, OrderStatus.CONFIRMED);
		assert.equal(capturedPrev, OrderStatus.PLACED);
		assert.equal(capturedActor, "staff-uuid-1");
		assert.equal(
			capturedNotes,
			"Order status updated from PLACED to CONFIRMED",
		);
		assert.ok(result.items.length > 0);
	});

	it("should successfully update status from READY to COMPLETED and set completion audit note", async () => {
		let capturedNotes: string | null | undefined;
		const order = createSampleOrder({ status: OrderStatus.READY });
		const repo = createMockOrderRepo({
			order,
			onUpdate: (_ord, _prev, _actor, notes) => {
				capturedNotes = notes;
			},
		});

		const useCase = new UpdateOrderStatusUseCase(repo);
		const result = await useCase.execute({
			orderId: order.id,
			status: OrderStatus.COMPLETED,
			restaurantId: "rest-uuid-1",
			actorId: "staff-uuid-1",
		});

		assert.equal(result.orderId, order.id);
		assert.equal(result.previousStatus, OrderStatus.READY);
		assert.equal(result.status, OrderStatus.COMPLETED);
		assert.equal(capturedNotes, ORDER_DEFAULTS.COMPLETED_AUDIT_NOTE);
		assert.equal(result.order.orderStatus, OrderStatus.COMPLETED);
	});

	it("should forward custom audit notes when provided", async () => {
		let capturedNotes: string | null | undefined;
		const order = createSampleOrder({ status: OrderStatus.CONFIRMED });
		const repo = createMockOrderRepo({
			order,
			onUpdate: (_ord, _prev, _actor, notes) => {
				capturedNotes = notes;
			},
		});

		const useCase = new UpdateOrderStatusUseCase(repo);
		await useCase.execute({
			orderId: order.id,
			status: OrderStatus.PREPARING,
			restaurantId: "rest-uuid-1",
			actorId: "staff-uuid-1",
			notes: "Chef started cooking burger",
		});

		assert.equal(capturedNotes, "Chef started cooking burger");
	});

	it("should successfully update status from READY to SERVED and SERVED to COMPLETED", async () => {
		const order = createSampleOrder({ status: OrderStatus.READY });
		const repo = createMockOrderRepo({ order });
		const useCase = new UpdateOrderStatusUseCase(repo);

		const resultServed = await useCase.execute({
			orderId: order.id,
			status: OrderStatus.SERVED,
			restaurantId: "rest-uuid-1",
			actorId: "staff-uuid-1",
		});
		assert.equal(resultServed.status, OrderStatus.SERVED);

		const resultCompleted = await useCase.execute({
			orderId: order.id,
			status: OrderStatus.COMPLETED,
			restaurantId: "rest-uuid-1",
			actorId: "staff-uuid-1",
		});
		assert.equal(resultCompleted.status, OrderStatus.COMPLETED);
	});

	it("should throw OrderNotFoundError when order does not exist", async () => {
		const repo = createMockOrderRepo({ order: null });
		const useCase = new UpdateOrderStatusUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					orderId: "missing-id",
					status: OrderStatus.CONFIRMED,
					restaurantId: "rest-uuid-1",
					actorId: "staff-uuid-1",
				}),
			(err: unknown) => err instanceof OrderNotFoundError,
		);
	});

	it("should throw ForbiddenRestaurantAccessError when order belongs to a different restaurant", async () => {
		const order = createSampleOrder({
			restaurantId: "restaurant-A",
			status: OrderStatus.PLACED,
		});
		const repo = createMockOrderRepo({ order });
		const useCase = new UpdateOrderStatusUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					orderId: order.id,
					status: OrderStatus.CONFIRMED,
					restaurantId: "restaurant-B", // Staff has access to restaurant-B only!
					actorId: "staff-uuid-1",
				}),
			(err: unknown) => err instanceof ForbiddenRestaurantAccessError,
		);
	});

	it("should throw InvalidOrderStatusTransitionError when transition is invalid", async () => {
		const order = createSampleOrder({ status: OrderStatus.PLACED });
		const repo = createMockOrderRepo({ order });
		const useCase = new UpdateOrderStatusUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					orderId: order.id,
					status: OrderStatus.COMPLETED, // Cannot jump from PLACED to COMPLETED
					restaurantId: "rest-uuid-1",
					actorId: "staff-uuid-1",
				}),
			(err: unknown) => err instanceof InvalidOrderStatusTransitionError,
		);
	});

	it("should propagate OrderStatusConflictError when repository throws concurrency conflict", async () => {
		const order = createSampleOrder({ status: OrderStatus.PREPARING });
		const repo = createMockOrderRepo({ order, conflict: true });
		const useCase = new UpdateOrderStatusUseCase(repo);

		await assert.rejects(
			() =>
				useCase.execute({
					orderId: order.id,
					status: OrderStatus.READY,
					restaurantId: "rest-uuid-1",
					actorId: "staff-uuid-1",
				}),
			(err: unknown) => err instanceof OrderStatusConflictError,
		);
	});
});
