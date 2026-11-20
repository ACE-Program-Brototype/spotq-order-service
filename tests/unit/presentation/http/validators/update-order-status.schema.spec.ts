import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import {
	updateOrderStatusBodySchema,
	updateOrderStatusParamSchema,
} from "@presentation/http/validators/orders/update-order-status.schema.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("updateOrderStatusParamSchema", () => {
	it("should succeed with a valid UUID", () => {
		const validUuid = "123e4567-e89b-12d3-a456-426614174000";
		const result = updateOrderStatusParamSchema.safeParse({
			orderId: validUuid,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.orderId, validUuid);
		}
	});

	it("should fail validation with invalid UUID format", () => {
		const result = updateOrderStatusParamSchema.safeParse({
			orderId: "invalid-uuid-123",
		});

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_ORDER_ID,
			);
		}
	});
});

describe("updateOrderStatusBodySchema", () => {
	it("should succeed with valid COMPLETED status", () => {
		const result = updateOrderStatusBodySchema.safeParse({
			status: OrderStatus.COMPLETED,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.status, OrderStatus.COMPLETED);
		}
	});

	it("should succeed with other valid OrderStatuses and optional notes", () => {
		const statuses = [
			OrderStatus.PREPARING,
			OrderStatus.READY,
			OrderStatus.SERVED,
			OrderStatus.CANCELLED,
		];

		for (const status of statuses) {
			const result = updateOrderStatusBodySchema.safeParse({
				status,
				notes: "Valid note",
			});
			assert.equal(result.success, true);
		}
	});

	it("should reject PLACED and CONFIRMED as they are set during order creation and payment success", () => {
		const placedResult = updateOrderStatusBodySchema.safeParse({
			status: OrderStatus.PLACED,
		});
		assert.equal(placedResult.success, false);

		const confirmedResult = updateOrderStatusBodySchema.safeParse({
			status: OrderStatus.CONFIRMED,
		});
		assert.equal(confirmedResult.success, false);
	});

	it("should fail validation with invalid status string", () => {
		const result = updateOrderStatusBodySchema.safeParse({
			status: "INVALID_STATUS",
		});

		assert.equal(result.success, false);
	});

	it("should fail validation with unknown fields due to strict mode", () => {
		const result = updateOrderStatusBodySchema.safeParse({
			status: OrderStatus.COMPLETED,
			extraField: "not allowed",
		});

		assert.equal(result.success, false);
	});

	it("should fail when notes exceed max length of 500", () => {
		const result = updateOrderStatusBodySchema.safeParse({
			status: OrderStatus.COMPLETED,
			notes: "a".repeat(501),
		});

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_CANCELLATION_REASON,
			);
		}
	});
});
