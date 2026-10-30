import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderRequestMapper } from "@presentation/http/mappers/order-request.mapper.ts";
import { ORDER_HISTORY_PAGINATION } from "@shared/constants/pagination.constants.ts";
import type { Request } from "express";

describe("OrderRequestMapper", () => {
	it("should map query and customerId to GetOrderHistoryInputDto with defaults", () => {
		const req = {
			user: { userId: "cust-123" },
			query: {},
		} as unknown as Request;

		const dto = OrderRequestMapper.toOrderHistoryInputDto(req);

		assert.deepEqual(dto, {
			customerId: "cust-123",
			page: ORDER_HISTORY_PAGINATION.DEFAULT_PAGE,
			limit: ORDER_HISTORY_PAGINATION.DEFAULT_LIMIT,
			status: undefined,
		});
	});

	it("should map query parameters when provided", () => {
		const req = {
			user: { userId: "cust-456" },
			query: {
				page: 3,
				limit: 25,
				status: OrderStatus.CONFIRMED,
			},
		} as unknown as Request;

		const dto = OrderRequestMapper.toOrderHistoryInputDto(req);

		assert.deepEqual(dto, {
			customerId: "cust-456",
			page: 3,
			limit: 25,
			status: OrderStatus.CONFIRMED,
		});
	});

	it("should map params, body, and customerId to CancelOrderInputDto", () => {
		const req = {
			user: { userId: "cust-owner-789" },
			params: { orderId: "ord-992817203" },
			body: { cancellation_reason: "Changed my mind" },
		} as unknown as Request;

		const dto = OrderRequestMapper.toCancelOrderInputDto(req);

		assert.deepEqual(dto, {
			orderId: "ord-992817203",
			customerId: "cust-owner-789",
			cancellationReason: "Changed my mind",
		});
	});

	it("should map CancelOrderInputDto with null cancellationReason when omitted", () => {
		const req = {
			user: { userId: "cust-owner-789" },
			params: { orderId: "ord-992817203" },
			body: {},
		} as unknown as Request;

		const dto = OrderRequestMapper.toCancelOrderInputDto(req);

		assert.deepEqual(dto, {
			orderId: "ord-992817203",
			customerId: "cust-owner-789",
			cancellationReason: null,
		});
	});
});
