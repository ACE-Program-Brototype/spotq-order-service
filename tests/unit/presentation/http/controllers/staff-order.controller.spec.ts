import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	GetStaffOrderDetailsInputDTO,
	GetStaffOrderDetailsOutputDTO,
} from "@application/dtos/orders/get-staff-order-details.dto.ts";
import type {
	GetStaffOrdersListInputDTO,
	GetStaffOrdersListResponseDTO,
} from "@application/dtos/orders/get-staff-orders.dto.ts";
import type {
	UpdateOrderStatusInputDTO,
	UpdateOrderStatusResponseDTO,
} from "@application/dtos/orders/update-order-status.dto.ts";
import type { IGetStaffOrderDetailsUseCase } from "@application/ports/use-cases/orders/get-staff-order-details.use-case.port.ts";
import type { IGetStaffOrdersListUseCase } from "@application/ports/use-cases/orders/get-staff-orders.use-case.port.ts";
import type { IUpdateOrderStatusUseCase } from "@application/ports/use-cases/orders/update-order-status.use-case.port.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { ForbiddenRestaurantAccessError } from "@domain/errors/order.errors.ts";
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
	const defaultMockGetStaffOrdersListUseCase: IGetStaffOrdersListUseCase = {
		execute: async () => ({
			orders: [],
			pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
		}),
	};

	const defaultMockGetStaffOrderDetailsUseCase: IGetStaffOrderDetailsUseCase = {
		execute: async (
			_dto: GetStaffOrderDetailsInputDTO,
		): Promise<GetStaffOrderDetailsOutputDTO> => ({
			order_id: "ord-123",
			order_number: "SQ-101",
			status: OrderStatus.PLACED,
			customer_notes: "Extra spicy",
			items: [],
			created_at: new Date().toISOString(),
		}),
	};

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
				} as unknown as UpdateOrderStatusResponseDTO;
			},
		};

		const controller = new StaffOrderController(
			mockUpdateOrderStatusUseCase,
			defaultMockGetStaffOrderDetailsUseCase,
			defaultMockGetStaffOrdersListUseCase,
		);

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

	it("should default notes to null when notes is undefined in update order status", async () => {
		let capturedDto: UpdateOrderStatusInputDTO | null = null;

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async (dto: UpdateOrderStatusInputDTO) => {
				capturedDto = dto;
				return {
					id: dto.orderId,
					orderId: dto.orderId,
					previousStatus: OrderStatus.CONFIRMED,
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
				} as unknown as UpdateOrderStatusResponseDTO;
			},
		};

		const controller = new StaffOrderController(
			mockUpdateOrderStatusUseCase,
			defaultMockGetStaffOrderDetailsUseCase,
			defaultMockGetStaffOrdersListUseCase,
		);

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

	it("should retrieve staff order details successfully with 200 OK", async () => {
		let capturedInputDto: GetStaffOrderDetailsInputDTO | null = null;

		const expectedResult: GetStaffOrderDetailsOutputDTO = {
			order_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			order_number: "SQ-101",
			status: OrderStatus.PLACED,
			customer_notes: "Please provide extra napkins.",
			items: [
				{
					menu_item_id: "item-1",
					name: "Margherita Pizza",
					variant_id: "var-1",
					variant_name: "Large",
					addons: [{ addon_id: "addon-1", name: "Extra Cheese" }],
					quantity: 2,
					special_instructions: "Less spicy please",
				},
			],
			created_at: "2026-10-06T13:50:00.000Z",
		};

		const mockGetStaffOrderDetailsUseCase: IGetStaffOrderDetailsUseCase = {
			execute: async (dto: GetStaffOrderDetailsInputDTO) => {
				capturedInputDto = dto;
				return expectedResult;
			},
		};

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async () => {
				throw new Error("Not implemented");
			},
		};

		const controller = new StaffOrderController(
			mockUpdateOrderStatusUseCase,
			mockGetStaffOrderDetailsUseCase,
			defaultMockGetStaffOrdersListUseCase,
		);

		const { res, getStatus, getBody } = createMockResponse();
		const req = {
			params: {
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
				orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			},
			user: {
				userId: "staff-1",
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		await controller.getOrderDetails(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(getBody().success, true);
		assert.equal(
			getBody().message,
			ORDER_MESSAGES.STAFF_ORDER_DETAILS_FETCHED_SUCCESS,
		);
		assert.deepEqual(getBody().data, expectedResult);
		assert.deepEqual(capturedInputDto, {
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
		});
	});

	it("should retrieve active staff orders list successfully with 200 OK", async () => {
		let capturedInputDto: GetStaffOrdersListInputDTO | null = null;
		const expectedResult: GetStaffOrdersListResponseDTO = {
			orders: [],
			pagination: {
				page: 1,
				limit: 20,
				total: 0,
				totalPages: 0,
			},
		};

		const mockGetStaffOrdersListUseCase: IGetStaffOrdersListUseCase = {
			execute: async (dto: GetStaffOrdersListInputDTO) => {
				capturedInputDto = dto;
				return expectedResult;
			},
		};

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async () => {
				throw new Error("Not implemented");
			},
		};

		const controller = new StaffOrderController(
			mockUpdateOrderStatusUseCase,
			defaultMockGetStaffOrderDetailsUseCase,
			mockGetStaffOrdersListUseCase,
		);

		const { res, getStatus, getBody } = createMockResponse();
		const req = {
			params: {
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			},
			query: {
				search: "ORD",
				status: [OrderStatus.PLACED],
				page: 1,
				limit: 20,
				sortOrder: "asc",
			},
			user: {
				userId: "staff-1",
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		await controller.getStaffOrderList(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(getBody().success, true);
		assert.equal(
			getBody().message,
			ORDER_MESSAGES.STAFF_ORDERS_LIST_FETCHED_SUCCESS,
		);
		assert.deepEqual(getBody().data, expectedResult);
		assert.deepEqual(capturedInputDto, {
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			search: "ORD",
			status: [OrderStatus.PLACED],
			page: 1,
			limit: 20,
			sortOrder: "asc",
			orderType: undefined,
		});
	});

	it("should throw ForbiddenRestaurantAccessError when caller's restaurantId does not match params", async () => {
		const mockGetStaffOrdersListUseCase: IGetStaffOrdersListUseCase = {
			execute: async () => {
				throw new Error("Not implemented");
			},
		};

		const mockUpdateOrderStatusUseCase: IUpdateOrderStatusUseCase = {
			execute: async () => {
				throw new Error("Not implemented");
			},
		};

		const controller = new StaffOrderController(
			mockUpdateOrderStatusUseCase,
			defaultMockGetStaffOrderDetailsUseCase,
			mockGetStaffOrdersListUseCase,
		);

		const { res } = createMockResponse();
		const req = {
			params: {
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			},
			user: {
				userId: "staff-1",
				restaurantId: "different-restaurant-id",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		await assert.rejects(
			async () => {
				await controller.getStaffOrderList(req, res);
			},
			(err: unknown) => err instanceof ForbiddenRestaurantAccessError,
		);
	});
});
