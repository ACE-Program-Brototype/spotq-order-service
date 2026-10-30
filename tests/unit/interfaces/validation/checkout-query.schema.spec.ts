import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkoutQuerySchema } from "@interfaces/validation/orders/checkout-query.schema.ts";

describe("checkoutQuerySchema validation", () => {
	it("should succeed with empty query object", () => {
		const result = checkoutQuerySchema.safeParse({});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.restaurantId, undefined);
			assert.equal(result.data.cartId, undefined);
		}
	});

	it("should succeed with valid restaurantId and cartId (UUID)", () => {
		const result = checkoutQuerySchema.safeParse({
			restaurantId: "rest-uuid-123",
			cartId: "123e4567-e89b-12d3-a456-426614174000",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.restaurantId, "rest-uuid-123");
			assert.equal(result.data.cartId, "123e4567-e89b-12d3-a456-426614174000");
		}
	});

	it("should fail validation with invalid cartId UUID format", () => {
		const result = checkoutQuerySchema.safeParse({
			cartId: "invalid-not-a-uuid",
		});
		assert.equal(result.success, false);
	});

	it("should fail validation when restaurantId is empty string", () => {
		const result = checkoutQuerySchema.safeParse({
			restaurantId: "   ",
		});
		assert.equal(result.success, false);
	});
});
