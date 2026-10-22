import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_DEFAULTS } from "@common/constants/message.constants.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaOrderRepository } from "@infrastructure/repositories/prisma-order.repository.ts";

interface FindManyArgs {
	where?: Record<string, unknown>;
	skip?: number;
	take?: number;
	orderBy?: Record<string, unknown>;
	select?: Record<string, unknown>;
}

interface CountArgs {
	where?: Record<string, unknown>;
}

describe("PrismaOrderRepository - getCustomerOrderHistory", () => {
	it("should query orders filtered by customerId with pagination and descending order", async () => {
		const captured: {
			findManyArgs?: FindManyArgs;
			countArgs?: CountArgs;
		} = {};

		const mockPrisma = {
			order: {
				findMany: async (args: FindManyArgs) => {
					captured.findManyArgs = args;
					return [
						{
							id: "ord-uuid-1",
							orderNumber: "SQ-001",
							restaurantId: "rest-uuid-1",
							orderStatus: "COMPLETED",
							grandTotal: { toFixed: () => "500.00" },
							createdAt: new Date("2026-10-06T13:50:00.000Z"),
							_count: { items: 2 },
						},
					];
				},
				count: async (args: CountArgs) => {
					captured.countArgs = args;
					return 25;
				},
			},
		} as unknown as PrismaClient;

		const repository = new PrismaOrderRepository(mockPrisma);

		const result = await repository.getCustomerOrderHistory({
			customerId: "user-uuid-123",
			page: 2,
			limit: 10,
			status: OrderStatus.COMPLETED,
		});

		assert.ok(captured.findManyArgs);
		assert.deepEqual(captured.findManyArgs.where, {
			userId: "user-uuid-123",
			orderStatus: OrderStatus.COMPLETED,
		});
		assert.equal(captured.findManyArgs.skip, 10);
		assert.equal(captured.findManyArgs.take, 10);
		assert.deepEqual(captured.findManyArgs.orderBy, { createdAt: "desc" });

		assert.ok(captured.countArgs);
		assert.deepEqual(captured.countArgs.where, {
			userId: "user-uuid-123",
			orderStatus: OrderStatus.COMPLETED,
		});

		assert.equal(result.totalOrders, 25);
		assert.equal(result.totalPages, 3);
		assert.equal(result.currentPage, 2);
		assert.equal(result.hasNext, true);
		assert.equal(result.orders.length, 1);
		assert.equal(result.orders[0]?.orderId, "ord-uuid-1");
		assert.equal(result.orders[0]?.grandTotal, 500);
		assert.equal(result.orders[0]?.itemsCount, 2);
	});

	it("should calculate hasNext as false on the last page", async () => {
		const mockPrisma = {
			order: {
				findMany: async () => [],
				count: async () => 20,
			},
		} as unknown as PrismaClient;

		const repository = new PrismaOrderRepository(mockPrisma);

		const result = await repository.getCustomerOrderHistory({
			customerId: "user-uuid-123",
			page: 2,
			limit: 10,
		});

		assert.equal(result.totalOrders, 20);
		assert.equal(result.totalPages, 2);
		assert.equal(result.currentPage, 2);
		assert.equal(result.hasNext, false);
	});

	it("should handle empty order history correctly", async () => {
		const mockPrisma = {
			order: {
				findMany: async () => [],
				count: async () => 0,
			},
		} as unknown as PrismaClient;

		const repository = new PrismaOrderRepository(mockPrisma);

		const result = await repository.getCustomerOrderHistory({
			customerId: "user-empty",
			page: 1,
			limit: 10,
		});

		assert.equal(result.totalOrders, 0);
		assert.equal(result.totalPages, 0);
		assert.equal(result.hasNext, false);
		assert.equal(result.orders.length, 0);
	});
});

describe("PrismaOrderRepository - findById", () => {
	it("should return Order domain entity when order exists", async () => {
		const fixedDate = new Date("2026-10-06T13:40:00.000Z");
		const mockPrisma = {
			order: {
				findUnique: async (args: { where: { id: string } }) => {
					assert.equal(args.where.id, "ord-123");
					return {
						id: "ord-123",
						orderNumber: "SQ-101",
						restaurantId: "rest-1",
						userId: "user-1",
						userName: null,
						userPhone: null,
						tableId: null,
						tableNumber: null,
						queueEntryId: null,
						paymentId: null,
						priority: 2,
						orderType: "DINE_IN",
						paymentMode: "ONLINE",
						paymentStatus: "PENDING",
						orderStatus: "PLACED",
						subtotal: 0,
						taxAmount: 0,
						platformFee: 0,
						discountAmount: 0,
						couponCode: null,
						grandTotal: 0,
						estimatedReadyAt: null,
						specialInstructions: null,
						cancellationReason: null,
						cancelledAt: null,
						items: [],
						statusHistory: [],
						createdAt: fixedDate,
						updatedAt: fixedDate,
					};
				},
			},
		} as unknown as PrismaClient;

		const repository = new PrismaOrderRepository(mockPrisma);
		const result = await repository.findById("ord-123");

		assert.ok(result instanceof Order);
		assert.equal(result.id, "ord-123");
		assert.equal(result.orderId, "ord-123");
		assert.equal(result.orderNumber, "SQ-101");
		assert.equal(result.restaurantId, "rest-1");
		assert.equal(result.userId, "user-1");
		assert.equal(result.orderStatus, OrderStatus.PLACED);
		assert.equal(result.cancellationReason, null);
		assert.equal(result.cancelledAt, null);
	});

	it("should return null when order is not found", async () => {
		const mockPrisma = {
			order: {
				findUnique: async () => null,
			},
		} as unknown as PrismaClient;

		const repository = new PrismaOrderRepository(mockPrisma);
		const result = await repository.findById("non-existent");

		assert.equal(result, null);
	});
});

describe("PrismaOrderRepository - cancelOrder", () => {
	it("should execute transaction to update order and create status history", async () => {
		const fixedDate = new Date("2026-10-06T13:52:00.000Z");
		let capturedUpdateArgs: unknown = null;
		let capturedHistoryArgs: unknown = null;

		const mockTx = {
			order: {
				update: async (args: unknown) => {
					capturedUpdateArgs = args;
					return {
						id: "ord-123",
						orderNumber: "SQ-101",
						orderStatus: "CANCELLED",
						cancellationReason: "Changed my mind",
						cancelledAt: fixedDate,
					};
				},
			},
			orderStatusHistory: {
				create: async (args: unknown) => {
					capturedHistoryArgs = args;
					return { id: "history-1" };
				},
			},
		};

		const mockPrisma = {
			$transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
				return await fn(mockTx);
			},
		} as unknown as PrismaClient;

		const order = new Order({
			id: "ord-123",
			orderNumber: "SQ-101",
			restaurantId: "rest-1",
			userId: "user-1",
			orderStatus: OrderStatus.CANCELLED,
			cancellationReason: "Changed my mind",
			cancelledAt: fixedDate,
		});

		const repository = new PrismaOrderRepository(mockPrisma);
		const result = await repository.cancelOrder(order, OrderStatus.PLACED);

		assert.deepEqual(capturedUpdateArgs, {
			where: { id: "ord-123" },
			data: {
				orderStatus: OrderStatus.CANCELLED,
				cancellationReason: "Changed my mind",
				cancelledAt: fixedDate,
			},
			select: {
				id: true,
				orderNumber: true,
				orderStatus: true,
				cancellationReason: true,
				cancelledAt: true,
			},
		});

		assert.deepEqual(capturedHistoryArgs, {
			data: {
				orderId: "ord-123",
				previousStatus: OrderStatus.PLACED,
				currentStatus: OrderStatus.CANCELLED,
				changedBy: "user-1",
				notes: "Changed my mind",
			},
		});

		assert.deepEqual(result, {
			orderId: "ord-123",
			orderNumber: "SQ-101",
			status: "CANCELLED",
			cancellationReason: "Changed my mind",
			cancelledAt: fixedDate,
		});
	});

	it("should use default cancellation note when cancellationReason is not provided", async () => {
		const fixedDate = new Date("2026-10-06T13:52:00.000Z");
		let capturedHistoryNotes: string | undefined;

		const mockTx = {
			order: {
				update: async () => ({
					id: "ord-123",
					orderNumber: "SQ-101",
					orderStatus: "CANCELLED",
					cancellationReason: null,
					cancelledAt: fixedDate,
				}),
			},
			orderStatusHistory: {
				create: async (args: { data?: { notes?: string } }) => {
					capturedHistoryNotes = args.data?.notes;
					return { id: "history-1" };
				},
			},
		};

		const mockPrisma = {
			$transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
				return await fn(mockTx);
			},
		} as unknown as PrismaClient;

		const order = new Order({
			id: "ord-123",
			orderNumber: "SQ-101",
			restaurantId: "rest-1",
			userId: "user-1",
			orderStatus: OrderStatus.CANCELLED,
			cancellationReason: null,
			cancelledAt: fixedDate,
		});

		const repository = new PrismaOrderRepository(mockPrisma);
		await repository.cancelOrder(order, OrderStatus.PLACED);

		assert.equal(capturedHistoryNotes, ORDER_DEFAULTS.CANCEL_AUDIT_NOTE);
	});

	it("should fallback changedBy to ORDER_DEFAULTS.CHANGED_BY_CUSTOMER when userId is null", async () => {
		const fixedDate = new Date("2026-10-06T13:52:00.000Z");
		let capturedChangedBy: string | undefined;

		const mockTx = {
			order: {
				update: async () => ({
					id: "ord-123",
					orderNumber: "SQ-101",
					orderStatus: "CANCELLED",
					cancellationReason: null,
					cancelledAt: fixedDate,
				}),
			},
			orderStatusHistory: {
				create: async (args: { data?: { changedBy?: string } }) => {
					capturedChangedBy = args.data?.changedBy;
					return { id: "history-1" };
				},
			},
		};

		const mockPrisma = {
			$transaction: async (fn: (tx: typeof mockTx) => Promise<unknown>) => {
				return await fn(mockTx);
			},
		} as unknown as PrismaClient;

		const order = new Order({
			id: "ord-123",
			orderNumber: "SQ-101",
			restaurantId: "rest-1",
			userId: null,
			orderStatus: OrderStatus.CANCELLED,
			cancellationReason: null,
			cancelledAt: fixedDate,
		});

		const repository = new PrismaOrderRepository(mockPrisma);
		await repository.cancelOrder(order, OrderStatus.PLACED);

		assert.equal(capturedChangedBy, ORDER_DEFAULTS.CHANGED_BY_CUSTOMER);
	});
});
