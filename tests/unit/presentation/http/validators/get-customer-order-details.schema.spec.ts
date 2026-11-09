import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCustomerOrderDetailsParamSchema } from "@presentation/http/validators/orders/get-customer-order-details.schema.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("getCustomerOrderDetailsParamSchema validation", () => {
	it("should succeed with a valid UUID orderId", () => {
		const validUuid = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";
		const result = getCustomerOrderDetailsParamSchema.safeParse({
			orderId: validUuid,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.orderId, validUuid);
		}
	});

	it("should fail validation with an invalid UUID format", () => {
		const result = getCustomerOrderDetailsParamSchema.safeParse({
			orderId: "invalid-uuid-format",
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
		const result = getCustomerOrderDetailsParamSchema.safeParse({});

		assert.equal(result.success, false);
	});

	it("should reject extra properties due to strict mode", () => {
		const result = getCustomerOrderDetailsParamSchema.safeParse({
			orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			extraField: "not allowed",
		});

		assert.equal(result.success, false);
	});
});

