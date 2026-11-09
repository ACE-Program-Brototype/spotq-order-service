import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetRestaurantOrderAnalyticsUseCase } from "@application/use-cases/internal/get-restaurant-order-analytics.use-case.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	GetRestaurantOrderAnalyticsRepoParams,
	RestaurantOrderAnalyticsRepoResult,
} from "@domain/types/order-repository.types.ts";
import { DEFAULT_TIMEZONE } from "@shared/constants/analytics.constants.ts";

describe("GetRestaurantOrderAnalyticsUseCase", () => {
	const mockResult: RestaurantOrderAnalyticsRepoResult = {
		overview: {
			revenue: {
				grossSalesRupees: 28450,
				discountRupees: 1707,
				netSalesRupees: 26743,
				taxCollectedRupees: 1337,
				totalBillAmountRupees: 28080,
				growthPercentage: 12.5,
			},
			orders: {
				totalOrderCount: 64,
				growthPercentage: 8.2,
				dineInCount: 48,
				takeawayCount: 16,
			},
			operations: {
				dinersServedCount: 48,
				uniqueCustomersCount: 52,
			},
		},
		orderStatusBreakdown: {
			totalOrdersTracked: 64,
			distribution: [
				{
					status: "COMPLETED",
					count: 56,
					percentage: 87.5,
					amountRupees: 24890,
				},
				{ status: "READY", count: 4, percentage: 6.25, amountRupees: 1780 },
			],
		},
	};

	it("should execute repository query with resolved date ranges and return complete DTO", async () => {
		let capturedParams: GetRestaurantOrderAnalyticsRepoParams | null = null;
		const mockOrderRepo: Partial<IOrderRepository> = {
			getRestaurantOrderAnalytics: async (params) => {
				capturedParams = params;
				return mockResult;
			},
		};

		const useCase = new GetRestaurantOrderAnalyticsUseCase(
			mockOrderRepo as IOrderRepository,
		);

		const result = await useCase.execute({
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			interval: "DAY",
			year: 2026,
			month: 11,
			day: 9,
			timezone: DEFAULT_TIMEZONE,
			status: "COMPLETED",
		});

		assert.ok(capturedParams);
		assert.strictEqual(
			(capturedParams as GetRestaurantOrderAnalyticsRepoParams).restaurantId,
			"2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		);
		assert.strictEqual(
			result.restaurantId,
			"2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		);
		assert.strictEqual(result.timezone, DEFAULT_TIMEZONE);
		assert.deepStrictEqual(result.overview, mockResult.overview);
		assert.deepStrictEqual(
			result.orderStatusBreakdown,
			mockResult.orderStatusBreakdown,
		);
		assert.strictEqual(result.filters.status, "COMPLETED");
		assert.ok(result.generatedAt);
	});

	it("should throw error if repository does not implement analytics", async () => {
		const emptyRepo: Partial<IOrderRepository> = {};
		const useCase = new GetRestaurantOrderAnalyticsUseCase(
			emptyRepo as IOrderRepository,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
				}),
			{
				name: "Error",
				message: "Order repository does not support analytics",
			},
		);
	});
});
