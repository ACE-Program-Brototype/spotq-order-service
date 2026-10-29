import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetOrderHistoryUseCase } from "@application/use-cases/orders/get-order-history.use-case.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { IOrderRepository } from "@domain/repositories/i-order.repository.ts";
import type { GetCustomerOrderHistoryRepoParams } from "@domain/types/order-repository.types";

describe("GetOrderHistoryUseCase", () => {
	it("should retrieve customer orders and return mapped order history", async () => {
		let capturedRepoParams: GetCustomerOrderHistoryRepoParams | undefined;
		const mockOrderRepo: IOrderRepository = {
			create: async () => {
				throw new Error("Not implemented");
			},
			findActiveByUserId: async () => {
				throw new Error("Not implemented");
			},
			getOrdersOverview: async () => {
				throw new Error("Not implemented");
			},
			getCustomerOrderHistory: async (params) => {
				capturedRepoParams = params;
				return {
					orders: [
						{
							orderId: "ord-1",
							orderNumber: "SQ-101",
							restaurantId: "rest-1",
							orderStatus: "COMPLETED",
							itemsCount: 2,
							grandTotal: 500,
							createdAt: new Date("2026-10-06T13:50:00.000Z"),
						},
						{
							orderId: "ord-2",
							orderNumber: "SQ-102",
							restaurantId: "rest-1",
							orderStatus: "COMPLETED",
							itemsCount: 1,
							grandTotal: 250,
							createdAt: new Date("2026-10-05T12:00:00.000Z"),
						},
					],
					totalOrders: 2,
					totalPages: 1,
					currentPage: 1,
					hasNext: false,
				};
			},
			findById: async () => null,
			cancelOrder: async () => {
				throw new Error("Not implemented");
			},
		};

		const useCase = new GetOrderHistoryUseCase(mockOrderRepo);

		const result = await useCase.execute({
			customerId: "cust-123",
			page: 1,
			limit: 10,
			status: OrderStatus.COMPLETED,
		});

		assert.ok(capturedRepoParams);
		assert.equal(capturedRepoParams.customerId, "cust-123");
		assert.equal(capturedRepoParams.page, 1);
		assert.equal(capturedRepoParams.limit, 10);
		assert.equal(capturedRepoParams.status, OrderStatus.COMPLETED);

		assert.equal(result.orders.length, 2);
		assert.equal(result.orders[0]?.order_id, "ord-1");
		assert.equal(result.orders[0]?.restaurant_id, "rest-1");
		assert.equal(result.orders[1]?.order_id, "ord-2");
		assert.equal(result.orders[1]?.restaurant_id, "rest-1");
	});

	it("should return empty orders when customer has no order history", async () => {
		const mockOrderRepo: IOrderRepository = {
			create: async () => {
				throw new Error("Not implemented");
			},
			findActiveByUserId: async () => {
				throw new Error("Not implemented");
			},
			getOrdersOverview: async () => {
				throw new Error("Not implemented");
			},
			getCustomerOrderHistory: async () => ({
				orders: [],
				totalOrders: 0,
				totalPages: 0,
				currentPage: 1,
				hasNext: false,
			}),
			findById: async () => null,
			cancelOrder: async () => {
				throw new Error("Not implemented");
			},
		};

		const useCase = new GetOrderHistoryUseCase(mockOrderRepo);

		const result = await useCase.execute({
			customerId: "cust-empty",
			page: 1,
			limit: 10,
		});

		assert.equal(result.orders.length, 0);
		assert.equal(result.pagination.total_orders, 0);
		assert.equal(result.pagination.total_pages, 0);
		assert.equal(result.pagination.has_next, false);
	});
});
