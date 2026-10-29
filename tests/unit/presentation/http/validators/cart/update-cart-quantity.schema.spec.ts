import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	updateCartItemQuantityBodySchema,
	updateCartItemQuantityParamSchema,
} from "@presentation/http/validators/cart/update-cart-quantity.schema.ts";

describe("updateCartItemQuantityParamSchema validation", () => {
	const validParams = {
		cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
		cartItemId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
	};

	it("should succeed with valid cartId and cartItemId UUIDs", () => {
		const parsed = updateCartItemQuantityParamSchema.parse(validParams);
		assert.equal(parsed.cartId, validParams.cartId);
		assert.equal(parsed.cartItemId, validParams.cartItemId);
	});

	it("should fail when cartId is not a valid UUID", () => {
		assert.throws(() => {
			updateCartItemQuantityParamSchema.parse({
				...validParams,
				cartId: "invalid-uuid",
			});
		});
	});

	it("should fail when cartItemId is not a valid UUID", () => {
		assert.throws(() => {
			updateCartItemQuantityParamSchema.parse({
				...validParams,
				cartItemId: "not-a-uuid",
			});
		});
	});
});

describe("updateCartItemQuantityBodySchema validation", () => {
	it("should succeed with valid quantity within 0 and 20", () => {
		const parsedZero = updateCartItemQuantityBodySchema.parse({ quantity: 0 });
		assert.equal(parsedZero.quantity, 0);

		const parsedMid = updateCartItemQuantityBodySchema.parse({ quantity: 5 });
		assert.equal(parsedMid.quantity, 5);

		const parsedMax = updateCartItemQuantityBodySchema.parse({ quantity: 20 });
		assert.equal(parsedMax.quantity, 20);
	});

	it("should fail when quantity is negative", () => {
		assert.throws(() => {
			updateCartItemQuantityBodySchema.parse({ quantity: -1 });
		});
	});

	it("should fail when quantity exceeds 20", () => {
		assert.throws(() => {
			updateCartItemQuantityBodySchema.parse({ quantity: 21 });
		});
	});

	it("should fail when quantity is a float / decimal", () => {
		assert.throws(() => {
			updateCartItemQuantityBodySchema.parse({ quantity: 2.5 });
		});
	});

	it("should fail when quantity is missing or not a number", () => {
		assert.throws(() => {
			updateCartItemQuantityBodySchema.parse({});
		});
		assert.throws(() => {
			updateCartItemQuantityBodySchema.parse({ quantity: "five" });
		});
	});
});
