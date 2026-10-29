import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { orderHistoryQuerySchema } from "@presentation/http/validators/orders/order-history-query.schema.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("orderHistoryQuerySchema validation", () => {
	it("should succeed with defaults when query is empty", () => {
		const result = orderHistoryQuerySchema.safeParse({});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 1);
			assert.equal(result.data.limit, 10);
			assert.equal(result.data.status, undefined);
		}
	});

	it("should parse and coerce valid string parameters", () => {
		const result = orderHistoryQuerySchema.safeParse({
			page: "2",
			limit: "25",
			status: OrderStatus.COMPLETED,
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 2);
			assert.equal(result.data.limit, 25);
			assert.equal(result.data.status, OrderStatus.COMPLETED);
		}
	});

	it("should fail validation when page is less than 1", () => {
		const result = orderHistoryQuerySchema.safeParse({
			page: 0,
		});
		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_PAGE,
			);
		}
	});

	it("should fail validation when limit is greater than 50", () => {
		const result = orderHistoryQuerySchema.safeParse({
			limit: 51,
		});
		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_LIMIT,
			);
		}
	});

	it("should fail validation when limit is less than 1", () => {
		const result = orderHistoryQuerySchema.safeParse({
			limit: 0,
		});
		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_LIMIT,
			);
		}
	});

	it("should fail validation with invalid status string", () => {
		const result = orderHistoryQuerySchema.safeParse({
			status: "INVALID_STATUS",
		});
		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_ORDER_STATUS,
			);
		}
	});
});
