import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { placeOrderBodySchema } from "@interfaces/validation/order/place-order.schema.ts";

describe("placeOrderBodySchema validation", () => {
	const validRestaurantId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
	const validCartId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";

	it("should succeed with a complete valid body (PAY_AT_COUNTER)", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "PAY_AT_COUNTER",
			specialInstructions: "Extra spicy",
		};

		const parsed = await placeOrderBodySchema.parseAsync(payload);
		assert.equal(parsed.restaurantId, validRestaurantId);
		assert.equal(parsed.cartId, validCartId);
		assert.equal(parsed.paymentMode, "PAY_AT_COUNTER");
		assert.equal(parsed.specialInstructions, "Extra spicy");
	});

	it("should succeed with minimal valid body (restaurantId & paymentMode ONLINE)", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			paymentMode: "ONLINE",
		};

		const parsed = await placeOrderBodySchema.parseAsync(payload);
		assert.equal(parsed.restaurantId, validRestaurantId);
		assert.equal(parsed.paymentMode, "ONLINE");
		assert.equal(parsed.cartId, undefined);
		assert.equal(parsed.specialInstructions, undefined);
	});

	it("should fail validation when restaurantId is missing", async () => {
		const payload = {
			paymentMode: "PAY_AT_COUNTER",
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});

	it("should fail validation with invalid restaurantId format", async () => {
		const payload = {
			restaurantId: "invalid-uuid",
			paymentMode: "PAY_AT_COUNTER",
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});

	it("should fail validation when paymentMode is COD (not supported)", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			paymentMode: "COD",
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});

	it("should fail validation with unknown paymentMode", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			paymentMode: "CRYPTO",
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});

	it("should fail validation with invalid cartId format", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: "invalid-uuid",
			paymentMode: "PAY_AT_COUNTER",
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});

	it("should fail validation when specialInstructions exceeds 250 characters", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			paymentMode: "PAY_AT_COUNTER",
			specialInstructions: "a".repeat(251),
		};

		await assert.rejects(
			async () => placeOrderBodySchema.parseAsync(payload),
			(err: unknown) => {
				const error = err as Error;
				assert.equal(error.name, "ZodError");
				return true;
			},
		);
	});
});
