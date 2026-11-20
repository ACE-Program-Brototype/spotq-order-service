import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetRestaurantProductAnalyticsUseCase } from "@application/use-cases/internal/get-restaurant-product-analytics.use-case.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	GetRestaurantProductAnalyticsRepoParams,
	RestaurantProductAnalyticsRepoResult,
} from "@domain/types/order-repository.types.ts";

describe("GetRestaurantProductAnalyticsUseCase", () => {
	const mockResult: RestaurantProductAnalyticsRepoResult = {
		totalProductsSold: 2,
		topSelling: {
			items: [
				{
					menuItemId: "item-1",
					name: "Chicken Dum Biryani",
					quantitySold: 10,
					grossSalesRupees: 2500,
					percentageOfTotalSales: 80,
					classification: "NORMAL",
				},
			],
			pagination: {
				totalItems: 1,
				totalPages: 1,
				currentPage: 1,
				limit: 10,
				hasNextPage: false,
				hasPrevPage: false,
			},
		},
		slowMoving: {
			items: [
				{
					menuItemId: "item-2",
					name: "Herbal Green Tea",
					quantitySold: 2,
					grossSalesRupees: 180,
					percentageOfTotalSales: 20,
					classification: "LOW_VOLUME",
				},
			],
			pagination: {
				totalItems: 1,
				totalPages: 1,
				currentPage: 1,
				limit: 10,
				hasNextPage: false,
				hasPrevPage: false,
			},
		},
	};

	it("should execute product analytics query with resolved date ranges and pagination defaults", async () => {
		let capturedParams: GetRestaurantProductAnalyticsRepoParams | null = null;
		const mockOrderRepo: Partial<IOrderRepository> = {
			getRestaurantProductAnalytics: async (params) => {
				capturedParams = params;
				return mockResult;
			},
		};

		const useCase = new GetRestaurantProductAnalyticsUseCase(
			mockOrderRepo as IOrderRepository,
		);

		const result = await useCase.execute({
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			interval: "DAY",
			year: 2026,
			month: 11,
			day: 9,
		});

		assert.ok(capturedParams);
		assert.strictEqual(
			(capturedParams as GetRestaurantProductAnalyticsRepoParams).restaurantId,
			"2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		);
		assert.strictEqual(
			(capturedParams as GetRestaurantProductAnalyticsRepoParams).page,
			1,
		);
		assert.strictEqual(
			(capturedParams as GetRestaurantProductAnalyticsRepoParams).limit,
			10,
		);

		assert.strictEqual(
			result.restaurantId,
			"2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		);
		assert.strictEqual(result.totalProductsSold, 2);
		assert.deepStrictEqual(result.topSelling, mockResult.topSelling);
		assert.deepStrictEqual(result.slowMoving, mockResult.slowMoving);
		assert.strictEqual(result.filters.page, 1);
		assert.strictEqual(result.filters.limit, 10);
	});

	it("should clamp limit to max 50 and fallback non-positive page to 1", async () => {
		let capturedParams: GetRestaurantProductAnalyticsRepoParams | null = null;
		const mockOrderRepo: Partial<IOrderRepository> = {
			getRestaurantProductAnalytics: async (params) => {
				capturedParams = params;
				return mockResult;
			},
		};

		const useCase = new GetRestaurantProductAnalyticsUseCase(
			mockOrderRepo as IOrderRepository,
		);

		await useCase.execute({
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			page: -5,
			limit: 100,
		});

		assert.ok(capturedParams);
		assert.strictEqual(
			(capturedParams as GetRestaurantProductAnalyticsRepoParams).page,
			1,
		);
		assert.strictEqual(
			(capturedParams as GetRestaurantProductAnalyticsRepoParams).limit,
			50,
		);
	});
});
