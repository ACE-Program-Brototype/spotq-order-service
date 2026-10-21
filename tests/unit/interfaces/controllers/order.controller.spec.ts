import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	OrderResponseDto,
	PlaceOrderInputDto,
} from "@application/dtos/orders/place-order.dto.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { OrderPriority } from "@domain/enums/order-priority.enum.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderType } from "@domain/enums/order-type.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { CartEmptyError } from "@domain/errors/cart-empty.error.ts";
import { InvalidPaymentModeError } from "@domain/errors/invalid-payment-mode.error.ts";
import { OrderController } from "@interfaces/controllers/order.controller.ts";
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

describe("OrderController", () => {
	const mockOrderResponse: OrderResponseDto = {
		id: "order-123",
		orderNumber: "ORD-ABC-123",
		restaurantId: "rest-123",
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

	it("should place order successfully with 201 Created and forward user details from req.body", async () => {
		let capturedDto: PlaceOrderInputDto | null = null;
		const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
			execute: async (dto: PlaceOrderInputDto) => {
				capturedDto = dto;
				return mockOrderResponse;
			},
		};
		const controller = new OrderController(mockPlaceOrderUseCase);

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

		assert.equal(getStatus(), HTTP_STATUS.CREATED);
		const body = getBody() as {
			success: boolean;
			message: string;
			data: { id: string };
		};
		assert.equal(body.success, true);
		assert.equal(body.message, ORDER_MESSAGES.ORDER_PLACED_SUCCESS);
		assert.equal(body.data.id, "order-123");
		assert.equal(
			(capturedDto as unknown as PlaceOrderInputDto)?.userName,
			"Jane Customer",
		);
		assert.equal(
			(capturedDto as unknown as PlaceOrderInputDto)?.userPhone,
			"+919876543210",
		);
	});

	it("should fallback to req.user for userName and userPhone when omitted from req.body", async () => {
		let capturedDto: PlaceOrderInputDto | null = null;
		const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
			execute: async (dto: PlaceOrderInputDto) => {
				capturedDto = dto;
				return mockOrderResponse;
			},
		};
		const controller = new OrderController(mockPlaceOrderUseCase);

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

		assert.equal(getStatus(), HTTP_STATUS.CREATED);
		assert.equal(
			(capturedDto as unknown as PlaceOrderInputDto)?.userName,
			"John Fallback",
		);
		assert.equal(
			(capturedDto as unknown as PlaceOrderInputDto)?.userPhone,
			"+919999999999",
		);
	});

	it("should propagate domain errors when use case throws", async () => {
		const mockPlaceOrderUseCase: IPlaceOrderUseCase = {
			execute: async () => {
				throw new CartEmptyError();
			},
		};
		const controller = new OrderController(mockPlaceOrderUseCase);

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
		const controller = new OrderController(mockPlaceOrderUseCase);

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
