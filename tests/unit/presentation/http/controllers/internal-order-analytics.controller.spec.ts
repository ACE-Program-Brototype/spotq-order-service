import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IGetRestaurantOrderAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-order-analytics.use-case.port.ts";
import type { IGetRestaurantProductAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-product-analytics.use-case.port.ts";
import { InternalOrderAnalyticsController } from "@presentation/http/controllers/internal/internal-order-analytics.controller.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import type { Request, Response } from "express";

describe("InternalOrderAnalyticsController", () => {
	function createMockResponse() {
		let capturedStatus = 0;
		let capturedBody: unknown = null;

		const res = {
			status: (code: number) => {
				capturedStatus = code;
				return res;
			},
			json: (body: unknown) => {
				capturedBody = body;
				return res;
			},
		} as unknown as Response;

		return {
			res,
			getStatus: () => capturedStatus,
			getBody: () => capturedBody,
		};
	}

	it("should return 200 with summary analytics data", async () => {
		const mockSummary = {
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			timezone: "Asia/Kolkata",
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
				distribution: [],
			},
			filters: {
				interval: "DAY" as const,
				day: 9,
				month: 11,
				year: 2026,
				timezone: "Asia/Kolkata",
			},
			generatedAt: new Date().toISOString(),
		};

		const mockSummaryUseCase: IGetRestaurantOrderAnalyticsUseCase = {
			execute: async () => mockSummary,
		};
		const mockProductUseCase: IGetRestaurantProductAnalyticsUseCase = {
			execute: async () => ({}) as never,
		};

		const controller = new InternalOrderAnalyticsController(
			mockSummaryUseCase,
			mockProductUseCase,
		);

		const req = {
			params: { restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345" },
			query: { interval: "DAY" },
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;

		await controller.getRestaurantOrderSummary(req, res, () => {
			nextCalled = true;
		});

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(getStatus(), HttpStatus.OK);
		assert.deepStrictEqual((getBody() as { data: unknown }).data, mockSummary);
	});

	it("should call next with error when use case throws", async () => {
		const expectedError = new Error("Database failure");
		const failingSummaryUseCase: IGetRestaurantOrderAnalyticsUseCase = {
			execute: async () => {
				throw expectedError;
			},
		};
		const mockProductUseCase: IGetRestaurantProductAnalyticsUseCase = {
			execute: async () => ({}) as never,
		};

		const controller = new InternalOrderAnalyticsController(
			failingSummaryUseCase,
			mockProductUseCase,
		);

		const req = {
			params: { restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345" },
			query: {},
		} as unknown as Request;

		const { res } = createMockResponse();
		let capturedError: unknown = null;

		await controller.getRestaurantOrderSummary(req, res, (err) => {
			capturedError = err;
		});

		assert.strictEqual(capturedError, expectedError);
	});

	it("should return 200 with product analytics data", async () => {
		const mockProducts = {
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			timezone: "Asia/Kolkata",
			totalProductsSold: 1,
			topSelling: {
				items: [],
				pagination: {
					totalItems: 0,
					totalPages: 0,
					currentPage: 1,
					limit: 10,
					hasNextPage: false,
					hasPrevPage: false,
				},
			},
			slowMoving: {
				items: [],
				pagination: {
					totalItems: 0,
					totalPages: 0,
					currentPage: 1,
					limit: 10,
					hasNextPage: false,
					hasPrevPage: false,
				},
			},
			filters: {
				interval: "DAY" as const,
				day: 9,
				month: 11,
				year: 2026,
				page: 1,
				limit: 10,
			},
			generatedAt: new Date().toISOString(),
		};

		const mockSummaryUseCase: IGetRestaurantOrderAnalyticsUseCase = {
			execute: async () => ({}) as never,
		};
		const mockProductUseCase: IGetRestaurantProductAnalyticsUseCase = {
			execute: async () => mockProducts,
		};

		const controller = new InternalOrderAnalyticsController(
			mockSummaryUseCase,
			mockProductUseCase,
		);

		const req = {
			params: { restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345" },
			query: { page: 1, limit: 10 },
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;

		await controller.getRestaurantProductAnalytics(req, res, () => {
			nextCalled = true;
		});

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(getStatus(), HttpStatus.OK);
		assert.deepStrictEqual((getBody() as { data: unknown }).data, mockProducts);
	});
});
