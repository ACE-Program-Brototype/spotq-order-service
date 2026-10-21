import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_HISTORY_PAGINATION } from "@common/constants/pagination.constants.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderRequestMapper } from "@interfaces/mappers/order-request.mapper.ts";
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
});
