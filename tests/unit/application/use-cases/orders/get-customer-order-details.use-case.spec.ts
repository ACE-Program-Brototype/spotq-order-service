import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetCustomerOrderDetailsUseCase } from "@application/use-cases/orders/get-customer-order-details.use-case.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { OrderNotFoundError } from "@domain/errors/order.errors.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

function createMockOrder(
	props: Partial<ConstructorParameters<typeof Order>[0]> = {},
): Order {
	return new Order({
		id: "order-uuid-1",
		orderNumber: "SQ-101",
		restaurantId: "rest-uuid-1",
		restaurantName: "Spice Garden Cafe",
		userId: "cust-uuid-1",
		userName: "John Doe",
		userPhone: "+919876543210",
		tableNumber: 4,
		queueEntryId: null,
		orderingMode: OrderingMode.SELF_ORDER,
		paymentMode: PaymentMode.ONLINE,
		paymentStatus: PaymentStatus.PAID,
		orderStatus: OrderStatus.COMPLETED,
		subtotal: 300,
		taxAmount: 15,
		platformFee: 2,
		discountAmount: 0,
		grandTotal: 317,
		specialInstructions: "No spicy",
		items: [
			{
				id: "item-1",
				menuItemId: "menu-item-1",
				itemName: "Paneer Biryani",
				quantity: 1,
				unitPrice: 300,
				totalPrice: 300,
				addons: [],
			},
		],
		...props,
	});
}

function createMockRepository(options: {
	orderToReturn?: Order | null;
	onFindByCustomerAndOrderId?: (customerId: string, orderId: string) => void;
}): IOrderRepository {
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
		findByRestaurantAndOrderId: async () => null,
		getRestaurantOrders: async () => ({
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			hasNext: false,
		}),
		getStaffOrders: async () => ({
			orders: [],
			totalOrders: 0,
			totalPages: 0,
			currentPage: 1,
			limit: 20,
			hasNext: false,
		}),
		updateOrderStatus: async (order) => order,
		findByCustomerAndOrderId: async (customerId: string, orderId: string) => {
			if (options.onFindByCustomerAndOrderId) {
				options.onFindByCustomerAndOrderId(customerId, orderId);
			}
			return options.orderToReturn ?? null;
		},
		getRestaurantOrderAnalytics: async () => ({}) as never,
		getRestaurantProductAnalytics: async () => ({}) as never,
		getAdminOrders: async () => ({}) as never,
	};
}

describe("GetCustomerOrderDetailsUseCase", () => {
	it("should retrieve order details successfully for authorized customer", async () => {
		const customerId = "cust-uuid-1";
		const orderId = "order-uuid-1";
		const mockOrder = createMockOrder({ id: orderId, userId: customerId });

		let capturedCustomerId = "";
		let capturedOrderId = "";

		const mockRepo = createMockRepository({
			orderToReturn: mockOrder,
			onFindByCustomerAndOrderId: (cust, ord) => {
				capturedCustomerId = cust;
				capturedOrderId = ord;
			},
		});

		const useCase = new GetCustomerOrderDetailsUseCase(mockRepo);

		const result = await useCase.execute({
			customerId,
			orderId,
		});

		assert.equal(capturedCustomerId, customerId);
		assert.equal(capturedOrderId, orderId);
		assert.equal(result.order.order_id, orderId);
		assert.equal(result.order.order_number, "SQ-101");
		assert.equal(result.order.restaurant.name, "Spice Garden Cafe");
		assert.equal(result.order.pricing.grand_total, 317);
		assert.equal(result.order.items.length, 1);
		assert.equal(result.order.items[0]?.name, "Paneer Biryani");
		assert.equal(result.order.payment.status, PaymentStatus.PAID);
		assert.equal(result.order.payment.method, PaymentMode.ONLINE);
		assert.equal(result.order.payment.amount_paid, 317);
		assert.ok(Array.isArray(result.order.status_history));
	});

	it("should throw OrderNotFoundError when order is not found", async () => {
		const mockRepo = createMockRepository({
			orderToReturn: null,
		});

		const useCase = new GetCustomerOrderDetailsUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					customerId: "cust-uuid-1",
					orderId: "non-existent-order",
				});
			},
			(err: unknown) => {
				assert(err instanceof OrderNotFoundError);
				assert.equal(err.message, ORDER_MESSAGES.ORDER_NOT_FOUND);
				return true;
			},
		);
	});

	it("should prevent cross-customer access and throw OrderNotFoundError under resource disclosure policy", async () => {
		// Customer B attempts to retrieve Customer A's order
		const attackerCustomerId = "attacker-cust-uuid";
		const victimOrderId = "victim-order-uuid";

		// Repository queries by BOTH customerId and orderId, returning null for mismatched customer
		const mockRepo = createMockRepository({
			orderToReturn: null, // does not match attacker
			onFindByCustomerAndOrderId: (cust, ord) => {
				assert.equal(cust, attackerCustomerId);
				assert.equal(ord, victimOrderId);
			},
		});

		const useCase = new GetCustomerOrderDetailsUseCase(mockRepo);

		await assert.rejects(
			async () => {
				await useCase.execute({
					customerId: attackerCustomerId,
					orderId: victimOrderId,
				});
			},
			(err: unknown) => {
				assert(err instanceof OrderNotFoundError);
				return true;
			},
		);
	});
});
