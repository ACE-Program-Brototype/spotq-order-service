import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaOrderRepository } from "@infrastructure/database/repositories/prisma-order.repository.ts";

describe("PrismaOrderRepository - Analytics", () => {
	const sampleDates = {
		restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		startDate: new Date("2026-11-08T18:30:00.000Z"),
		nextPeriodStart: new Date("2026-11-09T18:30:00.000Z"),
		prevStartDate: new Date("2026-11-07T18:30:00.000Z"),
	};

	describe("getRestaurantOrderAnalytics", () => {
		it("should execute aggregate, count, queryRaw, and groupBy queries and return formatted metrics", async () => {
			let aggregateCalls = 0;
			let countCalls = 0;

			const mockPrisma = {
				order: {
					aggregate: async () => {
						aggregateCalls++;
						if (aggregateCalls === 1) {
							// Current period revenue
							return {
								_sum: {
									subtotal: 30000,
									discountAmount: 2000,
									taxAmount: 1400,
									grandTotal: 29400,
								},
							};
						}
						// Previous period revenue
						return {
							_sum: {
								grandTotal: 20000,
							},
						};
					},
					count: async () => {
						countCalls++;
						if (countCalls === 1) return 100; // totalOrderCount
						if (countCalls === 2) return 80; // prevOrderCount
						if (countCalls === 3) return 60; // dineInCount
						if (countCalls === 4) return 60; // dinersServedCount
						return 0;
					},
					groupBy: async () => [
						{
							orderStatus: "COMPLETED",
							_count: { id: 85 },
							_sum: { grandTotal: 25000 },
						},
						{
							orderStatus: "CANCELLED",
							_count: { id: 15 },
							_sum: { grandTotal: 4400 },
						},
					],
				},
				$queryRaw: async () => [{ count: 75 }],
			} as unknown as PrismaClient;

			const repo = new PrismaOrderRepository(mockPrisma);
			const result = await repo.getRestaurantOrderAnalytics(sampleDates);

			// Revenue assertions
			assert.strictEqual(result.overview.revenue.grossSalesRupees, 30000);
			assert.strictEqual(result.overview.revenue.discountRupees, 2000);
			assert.strictEqual(result.overview.revenue.netSalesRupees, 28000);
			assert.strictEqual(result.overview.revenue.taxCollectedRupees, 1400);
			assert.strictEqual(result.overview.revenue.totalBillAmountRupees, 29400);
			// Growth %: ((29400 - 20000) / 20000) * 100 = 47.0%
			assert.strictEqual(result.overview.revenue.growthPercentage, 47);

			// Orders assertions
			assert.strictEqual(result.overview.orders.totalOrderCount, 100);
			// Order Growth %: ((100 - 80) / 80) * 100 = 25.0%
			assert.strictEqual(result.overview.orders.growthPercentage, 25);
			assert.strictEqual(result.overview.orders.dineInCount, 60);
			assert.strictEqual(result.overview.orders.takeawayCount, 40);

			// Operations
			assert.strictEqual(result.overview.operations.dinersServedCount, 60);
			assert.strictEqual(result.overview.operations.uniqueCustomersCount, 75);

			// Order Status Breakdown
			assert.strictEqual(result.orderStatusBreakdown.totalOrdersTracked, 100);
			assert.strictEqual(result.orderStatusBreakdown.distribution.length, 2);
			assert.strictEqual(
				result.orderStatusBreakdown.distribution[0]?.status,
				"COMPLETED",
			);
			assert.strictEqual(
				result.orderStatusBreakdown.distribution[0]?.count,
				85,
			);
			assert.strictEqual(
				result.orderStatusBreakdown.distribution[0]?.percentage,
				85,
			);
		});
	});

	describe("getRestaurantProductAnalytics", () => {
		it("should group order items and return topSelling and slowMoving with correct classifications", async () => {
			const mockPrisma = {
				orderItem: {
					groupBy: async () => [
						{
							menuItemId: "item-1",
							itemName: "Chicken Biryani",
							_sum: { quantity: 50, totalPrice: 15000 },
						},
						{
							menuItemId: "item-2",
							itemName: "Butter Naan",
							_sum: { quantity: 100, totalPrice: 5000 },
						},
						{
							menuItemId: "item-3",
							itemName: "Green Tea",
							_sum: { quantity: 2, totalPrice: 100 },
						},
					],
				},
			} as unknown as PrismaClient;

			const repo = new PrismaOrderRepository(mockPrisma);
			const result = await repo.getRestaurantProductAnalytics({
				restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
				startDate: sampleDates.startDate,
				nextPeriodStart: sampleDates.nextPeriodStart,
				page: 1,
				limit: 10,
			});

			assert.strictEqual(result.totalProductsSold, 3);

			// topSelling sorted by quantitySold DESC (Butter Naan: 100, Biryani: 50, Green Tea: 2)
			assert.strictEqual(result.topSelling.items.length, 3);
			assert.strictEqual(result.topSelling.items[0]?.name, "Butter Naan");
			assert.strictEqual(result.topSelling.items[0]?.quantitySold, 100);
			assert.strictEqual(result.topSelling.items[1]?.name, "Chicken Biryani");
			assert.strictEqual(result.topSelling.items[1]?.quantitySold, 50);

			// slowMoving: only Green Tea has quantity <= 3
			assert.strictEqual(result.slowMoving.items.length, 1);
			assert.strictEqual(result.slowMoving.items[0]?.name, "Green Tea");
			assert.strictEqual(result.slowMoving.items[0]?.quantitySold, 2);
			assert.strictEqual(
				result.slowMoving.items[0]?.classification,
				"LOW_VOLUME",
			);
		});
	});
});
