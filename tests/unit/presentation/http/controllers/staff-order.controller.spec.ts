import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	UpdateOrderStatusInputDTO,
	UpdateOrderStatusResponseDTO,
} from "@application/dtos/orders/update-order-status.dto.ts";
import type { IUpdateOrderStatusUseCase } from "@application/ports/use-cases/orders/update-order-status.use-case.port.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { StaffOrderController } from "@presentation/http/controllers/staff-order.controller.ts";
import { AUTH_ROLES } from "@shared/constants/auth.constants.ts";
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
	return {
		res,
		getStatus: () => respondedStatus,
		getBody: () =>
			responseBody as {
				success: boolean;
				statusCode: number;
				message: string;
				data: unknown;
			},
	};
}

describe("StaffOrderController", () => {
	it("should update order status successfully with 200 OK and success message", async () => {
		let capturedDto: UpdateOrderStatusInputDTO | null = null;

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async (dto: UpdateOrderStatusInputDTO) => {
				capturedDto = dto;
				return {
					id: dto.orderId,
					orderId: dto.orderId,
					previousStatus: OrderStatus.READY,
					status: dto.status,
					orderNumber: "SQ-101",
					restaurantId: dto.restaurantId,
					restaurantName: "SpotQ Test Kitchen",
					userId: "user-1",
					userName: "John Doe",
					userPhone: "9876543210",
					tableId: null,
					tableNumber: 4,
					queueEntryId: null,
					priority: 2,
					orderType: "DINE_IN",
					paymentMode: "ONLINE",
					paymentStatus: "PAID",
					orderStatus: dto.status,
					subtotal: 300,
					taxAmount: 15,
					platformFee: 5,
					discountAmount: 0,
					grandTotal: 320,
					specialInstructions: null,
					items: [],
					createdAt: new Date().toISOString(),
					order: {} as unknown as UpdateOrderStatusResponseDTO["order"],
				} as UpdateOrderStatusResponseDTO;
			},
		};

		const controller = new StaffOrderController(mockUpdateOrderStatusUseCase);

		const { res, getStatus, getBody } = createMockResponse();
		const req = {
			params: { orderId: "ord-123" },
			body: { status: OrderStatus.COMPLETED, notes: "Ready for pickup" },
			user: {
				userId: "staff-1",
				restaurantId: "rest-1",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		await controller.updateOrderStatus(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(getBody().success, true);
		assert.equal(
			getBody().message,
			ORDER_MESSAGES.ORDER_STATUS_UPDATED_SUCCESS,
		);
		assert.deepEqual(capturedDto, {
			orderId: "ord-123",
			status: OrderStatus.COMPLETED,
			restaurantId: "rest-1",
			actorId: "staff-1",
			notes: "Ready for pickup",
		});
	});

	it("should update order status successfully without optional notes", async () => {
		let capturedDto: UpdateOrderStatusInputDTO | null = null;

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async (dto: UpdateOrderStatusInputDTO) => {
				capturedDto = dto;
				return {
					id: dto.orderId,
					orderId: dto.orderId,
					previousStatus: OrderStatus.PLACED,
					status: dto.status,
					orderNumber: "SQ-102",
					restaurantId: dto.restaurantId,
					restaurantName: "SpotQ Test Kitchen",
					userId: "user-2",
					userName: "Jane Doe",
					userPhone: null,
					tableId: null,
					tableNumber: null,
					queueEntryId: null,
					priority: 2,
					orderType: "TAKEAWAY",
					paymentMode: "ONLINE",
					paymentStatus: "PAID",
					orderStatus: dto.status,
					subtotal: 150,
					taxAmount: 7.5,
					platformFee: 2.5,
					discountAmount: 0,
					grandTotal: 160,
					specialInstructions: null,
					items: [],
					createdAt: new Date().toISOString(),
					order: {} as unknown as UpdateOrderStatusResponseDTO["order"],
				} as UpdateOrderStatusResponseDTO;
			},
		};

		const controller = new StaffOrderController(mockUpdateOrderStatusUseCase);

		const { res, getStatus, getBody } = createMockResponse();
		const req = {
			params: { orderId: "ord-456" },
			body: { status: OrderStatus.READY },
			user: {
				userId: "staff-2",
				restaurantId: "rest-99",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		await controller.updateOrderStatus(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(getBody().success, true);
		assert.deepEqual(capturedDto, {
			orderId: "ord-456",
			status: OrderStatus.READY,
			restaurantId: "rest-99",
			actorId: "staff-2",
			notes: null,
		});
	});
});
