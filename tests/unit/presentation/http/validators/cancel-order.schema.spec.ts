import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	cancelOrderBodySchema,
	cancelOrderParamSchema,
} from "@presentation/http/validators/orders/cancel-order.schema.ts";
import { ORDER_LIMITS } from "@shared/constants/limits.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("cancelOrderParamSchema validation", () => {
	it("should succeed with a valid UUID orderId", () => {
		const validUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
		const result = cancelOrderParamSchema.safeParse({ orderId: validUuid });
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.orderId, validUuid);
		}
	});

	it("should fail validation with an invalid UUID format", () => {
		const result = cancelOrderParamSchema.safeParse({
			orderId: "invalid-uuid",
		});
		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_ORDER_ID,
			);
		}
	});

	it("should fail validation when orderId is missing", () => {
		const result = cancelOrderParamSchema.safeParse({});
		assert.equal(result.success, false);
	});
});

describe("cancelOrderBodySchema validation", () => {
	it("should succeed with valid cancellation_reason", () => {
		const result = cancelOrderBodySchema.safeParse({
			cancellation_reason: "Changed my mind",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.cancellation_reason, "Changed my mind");
		}
	});

	it("should succeed when body is empty or cancellation_reason is omitted", () => {
		const result = cancelOrderBodySchema.safeParse({});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.cancellation_reason, undefined);
		}
	});

	it("should succeed when cancellation_reason is null", () => {
		const result = cancelOrderBodySchema.safeParse({
			cancellation_reason: null,
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.cancellation_reason, null);
		}
	});

	it("should trim whitespace from cancellation_reason", () => {
		const result = cancelOrderBodySchema.safeParse({
			cancellation_reason: "  Changed my mind  ",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.cancellation_reason, "Changed my mind");
		}
	});

	it("should fail validation when cancellation_reason exceeds max length", () => {
		const longReason = "a".repeat(
			ORDER_LIMITS.MAX_CANCELLATION_REASON_LENGTH + 1,
		);
		const result = cancelOrderBodySchema.safeParse({
			cancellation_reason: longReason,
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
