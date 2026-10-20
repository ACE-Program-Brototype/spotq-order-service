import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartIdParamSchema } from "@interfaces/validation/cart/cart-param.schema.ts";

describe("cartIdParamSchema validation", () => {
	it("should succeed with a valid UUIDv4", () => {
		const validUuid = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
		const result = cartIdParamSchema.safeParse({ cartId: validUuid });

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.cartId, validUuid);
		}
	});

	it("should fail validation with an invalid UUID format", () => {
		const invalidId = "not-a-valid-uuid";
		const result = cartIdParamSchema.safeParse({ cartId: invalidId });

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(result.error.issues[0]?.message, "Invalid cart ID format");
		}
	});
});
