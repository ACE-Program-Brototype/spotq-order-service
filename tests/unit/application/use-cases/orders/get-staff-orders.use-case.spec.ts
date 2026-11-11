import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RestaurantValidationResultDTO } from "@application/dtos/external/restaurant-validation.dto.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import { GetStaffOrdersListUseCase } from "@application/use-cases/orders/get-staff-orders.use-case.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import { RestaurantNotFoundError } from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	GetStaffOrdersRepoParams,
	GetStaffOrdersRepoResult,
} from "@domain/types/order-repository.types.ts";

describe("GetStaffOrdersListUseCase", () => {
	const validRestaurantId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";

	function createMockRestaurantClient(
		shouldSucceed = true,
	): IRestaurantServiceClient {
		return {
			validateRestaurant: async (restaurantId: string) => {
				if (!shouldSucceed) {
					throw new RestaurantNotFoundError(
						`Restaurant not found: ${restaurantId}`,
					);
				}
				return {
					restaurantId,
					restaurantName: "Test Kitchen",
					isBlocked: false,
					verificationStatus: "ACTIVE",
					canAccessQueueService: false,
				} as RestaurantValidationResultDTO;
			},
		};
	}

	function createMockOrderRepository(
		onCall?: (params: GetStaffOrdersRepoParams) => void,
	): IOrderRepository {
		return {
			create: async () => {
				throw new Error("Not implemented");
			},
			findById: async () => null,
			findByIdempotencyKey: async () => null,
			findActiveByUserId: async () => null,
			getOrdersOverview: async () => {
				throw new Error("Not implemented");
			},
			getCustomerOrderHistory: async () => {
				throw new Error("Not implemented");
			},
			cancelOrder: async () => {
				throw new Error("Not implemented");
			},
			updatePaymentReference: async () => {},
			updatePaymentAndOrderStatus: async () => {},
			getRestaurantOrders: async () => {
				throw new Error("Not implemented");
			},
			findByRestaurantAndOrderId: async () => null,
			findByCustomerAndOrderId: async () => null,
			updateOrderStatus: async () => {
				throw new Error("Not implemented");
			},
			getStaffOrders: async (params: GetStaffOrdersRepoParams) => {
				if (onCall) {
					onCall(params);
				}
				const result: GetStaffOrdersRepoResult = {
					orders: [
						{
							id: "ord-1",
							orderNumber: "ORD-001",
							orderType: RestaurantPlan.QUEUE_PRO,
							status: OrderStatus.PLACED,
							createdAt: new Date("2026-10-26T10:30:00.000Z"),
							queueEntryId: "q-1",
							items: [
								{
									menuItemId: "item-1",
									name: "Veg Burger",
									quantity: 2,
									variantId: null,
									variantName: null,
									addons: [],
								},
							],
						},
					],
					totalOrders: 1,
					totalPages: 1,
					currentPage: params.page,
					limit: params.limit,
					hasNext: false,
				};
				return result;
			},
			getRestaurantOrderAnalytics: async () => {
				throw new Error("Not implemented");
			},
			getRestaurantProductAnalytics: async () => {
				throw new Error("Not implemented");
			},
		};
	}

	it("should validate restaurant and return orders list", async () => {
		let capturedParams: GetStaffOrdersRepoParams | undefined;
		const mockRestaurantClient = createMockRestaurantClient(true);
		const mockOrderRepo = createMockOrderRepository((params) => {
			capturedParams = params;
		});

		const useCase = new GetStaffOrdersListUseCase(
			mockRestaurantClient,
			mockOrderRepo,
		);

		const result = await useCase.execute({
			restaurantId: validRestaurantId,
			search: "ORD",
			status: [OrderStatus.PLACED, OrderStatus.CONFIRMED],
			orderType: RestaurantPlan.QUEUE_PRO,
			sortOrder: "asc",
			page: 1,
			limit: 20,
		});

		assert.equal(capturedParams?.restaurantId, validRestaurantId);
		assert.equal(capturedParams?.search, "ORD");
		assert.deepEqual(capturedParams?.status, [
			OrderStatus.PLACED,
			OrderStatus.CONFIRMED,
		]);
		assert.equal(capturedParams?.orderType, RestaurantPlan.QUEUE_PRO);
		assert.equal(capturedParams?.sortOrder, "asc");
		assert.equal(capturedParams?.page, 1);
		assert.equal(capturedParams?.limit, 20);

		assert.equal(result.orders.length, 1);
		const firstOrder = result.orders[0];
		assert.ok(firstOrder);
		assert.equal(firstOrder.id, "ord-1");
		assert.equal(firstOrder.queueId, "q-1");
		assert.equal(result.pagination.total, 1);
	});

	it("should throw RestaurantNotFoundError when restaurant validation fails", async () => {
		const mockRestaurantClient = createMockRestaurantClient(false);
		const mockOrderRepo = createMockOrderRepository();

		const useCase = new GetStaffOrdersListUseCase(
			mockRestaurantClient,
			mockOrderRepo,
		);

		await assert.rejects(
			async () => {
				await useCase.execute({
					restaurantId: "invalid-rest-id",
					page: 1,
					limit: 20,
				});
			},
			{
				name: "RestaurantNotFoundError",
			},
		);
	});
});
