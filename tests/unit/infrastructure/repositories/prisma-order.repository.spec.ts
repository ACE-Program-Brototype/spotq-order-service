import assert from "node:assert/strict";
import { describe, it } from "node:test";
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
