import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { cancelOrderBodySchema } from "@interfaces/validation/orders/cancel-order-body.schema.ts";

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

	it("should fail validation when cancellation_reason exceeds 500 characters", () => {
		const longReason = "a".repeat(501);
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
