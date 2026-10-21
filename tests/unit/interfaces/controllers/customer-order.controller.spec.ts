import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { CustomerOrderController } from "@interfaces/controllers/customer-order.controller.ts";
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
		const mockUseCase: IGetOrderHistoryUseCase = {
			execute: async (dto) => {
				capturedInput = dto;
				return mockResponseData;
			},
		};

		const controller = new CustomerOrderController(mockUseCase);
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

		assert.equal(getStatus(), HTTP_STATUS.OK);
		assert.deepEqual(capturedInput, {
			customerId: "user-cust-1",
			page: 1,
			limit: 10,
			status: "COMPLETED",
		});
		assert.deepEqual(getBody(), {
			success: true,
			statusCode: HTTP_STATUS.OK,
			message: ORDER_MESSAGES.HISTORY_FETCHED_SUCCESS,
			data: mockResponseData,
		});
	});
});
