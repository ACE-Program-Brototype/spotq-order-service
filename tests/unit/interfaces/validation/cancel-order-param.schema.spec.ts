import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { cancelOrderParamSchema } from "@interfaces/validation/orders/cancel-order-param.schema.ts";

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
