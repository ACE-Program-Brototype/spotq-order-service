import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cartItemParamSchema } from "@interfaces/validation/cart-item-param.schema.ts";

describe("cartItemParamSchema validation", () => {
	const validParams = {
		cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
		cartItemId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
	};

	it("should succeed with valid cartId and cartItemId UUIDs", () => {
		const parsed = cartItemParamSchema.parse(validParams);
		assert.equal(parsed.cartId, validParams.cartId);
		assert.equal(parsed.cartItemId, validParams.cartItemId);
	});

	it("should fail when cartId is not a valid UUID", () => {
		assert.throws(() => {
			cartItemParamSchema.parse({
				...validParams,
				cartId: "invalid-uuid",
			});
		});
	});

	it("should fail when cartItemId is not a valid UUID", () => {
		assert.throws(() => {
			cartItemParamSchema.parse({
				...validParams,
				cartItemId: "not-a-uuid",
			});
		});
	});
});
