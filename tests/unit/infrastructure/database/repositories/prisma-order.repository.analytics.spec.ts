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
		it("should execute aggregated SQL and groupBy queries and return formatted metrics", async () => {
			let queryRawCalls = 0;

			const mockPrisma = {
				order: {
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
				$queryRaw: async () => {
					queryRawCalls++;
					if (queryRawCalls === 1) {
						// Current period overview aggregation
						return [
							{
								gross_sales: 30000,
								discount_amount: 2000,
								tax_amount: 1400,
								total_bill_amount: 29400,
								total_order_count: 100,
								dine_in_count: 60,
								unique_customers_count: 75,
							},
						];
					}
					// Previous period aggregation
					return [
						{
							prev_sales: 20000,
							prev_order_count: 80,
						},
					];
				},
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

			// Operations: dinersServedCount is 0 per SCRUM-1275 AC 7
			assert.strictEqual(result.overview.operations.dinersServedCount, 0);
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
		it("should query DB for topSelling and slowMoving with correct ordering and classifications", async () => {
			let queryRawCalls = 0;

			const mockPrisma = {
				$queryRaw: async () => {
					queryRawCalls++;
					if (queryRawCalls === 1) {
						// 1. Totals
						return [
							{
								total_products_sold: 3,
								total_period_sales: 20100,
							},
						];
					}
					if (queryRawCalls === 2) {
						// 2. Top Selling (sorted by DB: Naan, Biryani, Green Tea)
						return [
							{
								menu_item_id: "item-2",
								item_name: "Butter Naan",
								quantity_sold: 100,
								gross_sales_rupees: 5000,
								full_count: 3,
							},
							{
								menu_item_id: "item-1",
								item_name: "Chicken Biryani",
								quantity_sold: 50,
								gross_sales_rupees: 15000,
								full_count: 3,
							},
							{
								menu_item_id: "item-3",
								item_name: "Green Tea",
								quantity_sold: 2,
								gross_sales_rupees: 100,
								full_count: 3,
							},
						];
					}
					// 3. Slow Moving (only Green Tea <= 3)
					return [
						{
							menu_item_id: "item-3",
							item_name: "Green Tea",
							quantity_sold: 2,
							gross_sales_rupees: 100,
							full_count: 1,
						},
					];
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
