import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	OrderResponseDTO,
	PlaceOrderInputDTO,
} from "@application/dtos/orders/place-order.dto.ts";
import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { OrderPriority } from "@domain/enums/order-priority.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart.errors.ts";
import { InvalidPaymentModeError } from "@domain/errors/order.errors.ts";
import { CustomerOrderController } from "@presentation/http/controllers/customer-order.controller.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import type { Request, Response } from "express";

function createMockResponse() {
	let respondedStatus = 0;
	let responseBody: unknown = null;
	const res = {
		status: (code: number) => {
			respondedStatus = code;
			return res;
		},
		json: (body: unknown) => {
			responseBody = body;
			return res;
		},
	} as unknown as Response;
	return { res, getStatus: () => respondedStatus, getBody: () => responseBody };
}

describe("CustomerOrderController", () => {
	const mockOrderResponse: OrderResponseDTO = {
		id: "order-123",
		orderNumber: "ORD-ABC-123",
		restaurantId: "rest-123",
		restaurantName: "SpotQ Test Kitchen",
		userId: "user-123",
		userName: "John Doe",
		userPhone: "9876543210",
		tableId: null,
		tableNumber: 4,
		queueEntryId: null,
		priority: OrderPriority.NORMAL,
		orderType: OrderType.DINE_IN,
		paymentMode: PaymentMode.PAY_AT_COUNTER,
		paymentStatus: PaymentStatus.PENDING,
		orderStatus: OrderStatus.PLACED,
		subtotal: 500,
		taxAmount: 25,
		platformFee: 5,
		discountAmount: 0,
		grandTotal: 530,
		specialInstructions: "Less spicy",
		items: [],
		createdAt: new Date().toISOString(),
	};

	const notImplemented = async () => {
		throw new Error("Not implemented in test");
	};

	function createController(overrides?: {
		placeOrder?: IPlaceOrderUseCase;
		getOrderHistory?: IGetOrderHistoryUseCase;
		cancelOrder?: ICancelOrderUseCase;
	}): CustomerOrderController {
		return new CustomerOrderController(
			overrides?.placeOrder ?? { execute: notImplemented },
			overrides?.getOrderHistory ?? { execute: notImplemented },
			overrides?.cancelOrder ?? { execute: notImplemented },
		);
	}

	describe("placeOrder", () => {
		it("should place order successfully with 201 Created and forward user details from req.body", async () => {
			let capturedDto: PlaceOrderInputDTO | null = null;
			const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
				execute: async (dto: PlaceOrderInputDTO) => {
					capturedDto = dto;
					return mockOrderResponse;
				},
			};
			const controller = createController({
				placeOrder: mockPlaceOrderUseCase,
			});

			const { res, getStatus, getBody } = createMockResponse();
			const req = {
				user: { userId: "user-123" },
				body: {
					restaurantId: "22222222-2222-2222-2222-222222222222",
					cartId: "00000000-0000-0000-0000-000000000001",
					paymentMode: "PAY_AT_COUNTER",
					userName: "Jane Customer",
					userPhone: "+919876543210",
					specialInstructions: "Less spicy",
				},
			} as unknown as Request;

			await controller.placeOrder(req, res);

			assert.equal(getStatus(), HttpStatus.CREATED);
			const body = getBody() as {
				success: boolean;
				message: string;
				data: { id: string };
			};
			assert.equal(body.success, true);
			assert.equal(body.message, ORDER_MESSAGES.ORDER_PLACED_SUCCESS);
			assert.equal(body.data.id, "order-123");
			assert.equal(
				(capturedDto as unknown as PlaceOrderInputDTO)?.userName,
				"Jane Customer",
			);
			assert.equal(
				(capturedDto as unknown as PlaceOrderInputDTO)?.userPhone,
				"+919876543210",
			);
		});

		it("should fallback to req.user for userName and userPhone when omitted from req.body", async () => {
			let capturedDto: PlaceOrderInputDTO | null = null;
			const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
				execute: async (dto: PlaceOrderInputDTO) => {
					capturedDto = dto;
					return mockOrderResponse;
				},
			};
			const controller = createController({
				placeOrder: mockPlaceOrderUseCase,
			});

			const { res, getStatus } = createMockResponse();
			const req = {
				user: {
					userId: "user-123",
					name: "John Fallback",
					phone: "+919999999999",
				},
				body: {
					restaurantId: "22222222-2222-2222-2222-222222222222",
					paymentMode: "PAY_AT_COUNTER",
				},
			} as unknown as Request;

			await controller.placeOrder(req, res);

			assert.equal(getStatus(), HttpStatus.CREATED);
			assert.equal(
				(capturedDto as unknown as PlaceOrderInputDTO)?.userName,
				"John Fallback",
			);
			assert.equal(
				(capturedDto as unknown as PlaceOrderInputDTO)?.userPhone,
				"+919999999999",
			);
		});

		it("should propagate domain errors when use case throws", async () => {
			const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
				execute: async () => {
					throw new CartEmptyError();
				},
			};
			const controller = createController({
				placeOrder: mockPlaceOrderUseCase,
			});

			const { res } = createMockResponse();
			const req = {
				user: { userId: "user-123" },
				body: {
					restaurantId: "22222222-2222-2222-2222-222222222222",
					paymentMode: "PAY_AT_COUNTER",
				},
			} as unknown as Request;

			await assert.rejects(
				async () => controller.placeOrder(req, res),
				CartEmptyError,
			);
		});

		it("should propagate InvalidPaymentModeError when use case throws", async () => {
			const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
				execute: async () => {
					throw new InvalidPaymentModeError();
				},
			};
			const controller = createController({
				placeOrder: mockPlaceOrderUseCase,
			});

			const { res } = createMockResponse();
			const req = {
				user: { userId: "user-123" },
				body: {
					restaurantId: "22222222-2222-2222-2222-222222222222",
					paymentMode: "ONLINE",
				},
			} as unknown as Request;

			await assert.rejects(
				async () => controller.placeOrder(req, res),
				InvalidPaymentModeError,
			);
		});
	});

	describe("getOrderHistory", () => {
		it("should get customer order history and send 200 OK", async () => {
			const mockResponseData = {
				orders: [
					{
						order_id: "ord-1",
						order_number: "SQ-101",
						restaurant_id: "rest-1",
						status: "COMPLETED",
						items_count: 2,
						total_amount: 863.0,
						created_at: "2026-10-06T13:50:00.000Z",
					},
				],
				pagination: {
					current_page: 1,
					total_pages: 1,
					total_orders: 1,
					has_next: false,
				},
			};

			let capturedInput: unknown = null;
			const mockGetHistoryUseCase: IGetOrderHistoryUseCase = {
				execute: async (dto) => {
					capturedInput = dto;
					return mockResponseData;
				},
			};

			const controller = createController({
				getOrderHistory: mockGetHistoryUseCase,
			});
			const { res, getStatus, getBody } = createMockResponse();

			const req = {
				user: {
					userId: "user-cust-1",
					role: "CUSTOMER",
				},
				query: {
					page: 1,
					limit: 10,
					status: "COMPLETED",
				},
			} as unknown as Request;

			await controller.getOrderHistory(req, res);

			assert.equal(getStatus(), HttpStatus.OK);
			assert.deepEqual(capturedInput, {
				customerId: "user-cust-1",
				page: 1,
				limit: 10,
				status: "COMPLETED",
			});
			assert.deepEqual(getBody(), {
				success: true,
				statusCode: HttpStatus.OK,
				message: ORDER_MESSAGES.HISTORY_FETCHED_SUCCESS,
				data: mockResponseData,
			});
		});
	});

	describe("cancelOrder", () => {
		it("should cancel order and send 200 OK with cancelled order data", async () => {
			const mockCancelledData = {
				order_id: "ord-123",
				order_number: "SQ-101",
				status: "CANCELLED",
				cancellation_reason: "Changed my mind",
				cancelled_at: "2026-10-06T13:52:00.000Z",
			};

			let capturedCancelDto: unknown = null;
			const mockCancelUseCase: ICancelOrderUseCase = {
				execute: async (dto) => {
					capturedCancelDto = dto;
					return mockCancelledData;
				},
			};

			const controller = createController({ cancelOrder: mockCancelUseCase });
			const { res, getStatus, getBody } = createMockResponse();

			const req = {
				user: {
					userId: "user-cust-1",
					role: "CUSTOMER",
				},
				params: {
					orderId: "ord-123",
				},
				body: {
					cancellation_reason: "Changed my mind",
				},
			} as unknown as Request;

			await controller.cancelOrder(req, res);

			assert.equal(getStatus(), HttpStatus.OK);
			assert.deepEqual(capturedCancelDto, {
				orderId: "ord-123",
				customerId: "user-cust-1",
				cancellationReason: "Changed my mind",
			});
			assert.deepEqual(getBody(), {
				success: true,
				statusCode: HttpStatus.OK,
				message: ORDER_MESSAGES.CANCEL_SUCCESS,
				data: mockCancelledData,
			});
		});
	});
});
