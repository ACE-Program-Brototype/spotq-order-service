import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { RestaurantValidationResultDTO } from "@application/dtos/external/restaurant-validation.dto.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port.ts";
import { GetStaffOrderDetailsUseCase } from "@application/use-cases/orders/get-staff-order-details.use-case.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import {
	OrderNotFoundError,
	RestaurantNotFoundError,
} from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";

describe("GetStaffOrderDetailsUseCase", () => {
	const validRestaurantId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
	const validOrderId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

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

	function createMockOrder(
		restaurantId = validRestaurantId,
		orderId = validOrderId,
	): Order {
		return new Order({
			id: orderId,
			orderNumber: "SQ-201",
			restaurantId,
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			specialInstructions: "Less oil",
			items: [
				{
					menuItemId: "item-1",
					itemName: "Paneer Tikka",
					variantId: "var-1",
					variantName: "Spicy",
					quantity: 2,
					unitPrice: 12.0,
					specialInstructions: "Extra green chutney",
					addons: [
						{
							addonId: "addon-mint",
							addonName: "Mint Sauce",
							price: 1.5,
						},
					],
				},
			],
		});
	}

	it("should successfully retrieve order details for an authorized staff member's restaurant", async () => {
		const expectedOrder = createMockOrder();
		let capturedRestaurantId = "";
		let capturedOrderId = "";

		const mockOrderRepo = {
			findByRestaurantAndOrderId: async (
				restaurantId: string,
				orderId: string,
			) => {
				capturedRestaurantId = restaurantId;
				capturedOrderId = orderId;
				return expectedOrder;
			},
		} as unknown as IOrderRepository;

		const useCase = new GetStaffOrderDetailsUseCase(
			createMockRestaurantClient(true),
			mockOrderRepo,
		);

		const result = await useCase.execute({
			restaurantId: validRestaurantId,
			orderId: validOrderId,
		});

		assert.equal(capturedRestaurantId, validRestaurantId);
		assert.equal(capturedOrderId, validOrderId);
		assert.equal(result.order_id, validOrderId);
		assert.equal(result.order_number, "SQ-201");
		assert.equal(result.status, OrderStatus.PLACED);
		assert.equal(result.customer_notes, "Less oil");
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.name, "Paneer Tikka");
		assert.equal(result.items[0]?.variant_name, "Spicy");
		assert.equal(result.items[0]?.special_instructions, "Extra green chutney");
		assert.equal(result.items[0]?.addons.length, 1);
		assert.equal(result.items[0]?.addons[0]?.name, "Mint Sauce");
	});

	it("should throw OrderNotFoundError when the order does not exist", async () => {
		const mockOrderRepo = {
			findByRestaurantAndOrderId: async () => null,
		} as unknown as IOrderRepository;

		const useCase = new GetStaffOrderDetailsUseCase(
			createMockRestaurantClient(true),
			mockOrderRepo,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					restaurantId: validRestaurantId,
					orderId: "nonexistent-order-id",
				}),
			(err: unknown) => {
				assert.ok(err instanceof OrderNotFoundError);
				assert.equal(err.message, "Order not found");
				return true;
			},
		);
	});

	it("should enforce tenant isolation by returning 404 when order belongs to a different restaurant", async () => {
		const otherRestaurantId = "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33";

		// Repository filters by { id: orderId, restaurantId: requestedRestaurantId }
		const mockOrderRepo = {
			findByRestaurantAndOrderId: async (
				restaurantId: string,
				_orderId: string,
			) => {
				if (restaurantId !== validRestaurantId) {
					return null;
				}
				return createMockOrder(validRestaurantId, validOrderId);
			},
		} as unknown as IOrderRepository;

		const useCase = new GetStaffOrderDetailsUseCase(
			createMockRestaurantClient(true),
			mockOrderRepo,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					restaurantId: otherRestaurantId,
					orderId: validOrderId,
				}),
			(err: unknown) => {
				assert.ok(err instanceof OrderNotFoundError);
				return true;
			},
		);
	});

	it("should throw RestaurantNotFoundError when restaurant validation fails", async () => {
		const mockOrderRepo = {
			findByRestaurantAndOrderId: async () => null,
		} as unknown as IOrderRepository;

		const useCase = new GetStaffOrderDetailsUseCase(
			createMockRestaurantClient(false),
			mockOrderRepo,
		);

		await assert.rejects(
			async () =>
				useCase.execute({
					restaurantId: validRestaurantId,
					orderId: validOrderId,
				}),
			(err: unknown) => {
				assert.ok(err instanceof RestaurantNotFoundError);
				return true;
			},
		);
	});

	it("should ensure the use case is purely read-only without modifying the order or triggering side effects", async () => {
		let mutationAttempted = false;

		const mockOrderRepo = {
			findByRestaurantAndOrderId: async () => createMockOrder(),
			update: async () => {
				mutationAttempted = true;
				return null;
			},
			updateOrderStatus: async () => {
				mutationAttempted = true;
				return createMockOrder();
			},
			delete: async () => {
				mutationAttempted = true;
				return false;
			},
		} as unknown as IOrderRepository;

		const useCase = new GetStaffOrderDetailsUseCase(
			createMockRestaurantClient(true),
			mockOrderRepo,
		);

		await useCase.execute({
			restaurantId: validRestaurantId,
			orderId: validOrderId,
		});

		assert.equal(mutationAttempted, false);
	});
});
