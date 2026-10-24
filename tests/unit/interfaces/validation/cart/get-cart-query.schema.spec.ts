import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { getCartQuerySchema } from "@interfaces/validation/cart/get-cart-query.schema.ts";

describe("getCartQuerySchema validation", () => {
	it("should succeed with an empty query object", () => {
		const result = getCartQuerySchema.safeParse({});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.restaurantId, undefined);
		}
	});

	it("should succeed with a valid restaurantId UUIDv4", () => {
		const validRestaurantId = "3fa85f64-5717-4562-b3fc-2c963f66afa6";
		const result = getCartQuerySchema.safeParse({
			restaurantId: validRestaurantId,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.restaurantId, validRestaurantId);
		}
	});

	it("should fail validation with an invalid restaurantId UUID format", () => {
		const invalidId = "invalid-uuid-format";
		const result = getCartQuerySchema.safeParse({ restaurantId: invalidId });

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				CART_MESSAGES.INVALID_RESTAURANT_ID,
			);
		}
	});
});
