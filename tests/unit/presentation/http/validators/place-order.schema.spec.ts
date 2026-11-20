import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { placeOrderBodySchema } from "@presentation/http/validators/orders/place-order.schema.ts";

describe("placeOrderBodySchema validation", () => {
	const validRestaurantId = "b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e";
	const validCartId = "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d";
	it("should succeed with a complete valid body", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			specialInstructions: "Extra spicy",
		};

		const parsed = await placeOrderBodySchema.parseAsync(payload);
		assert.equal(parsed.restaurantId, validRestaurantId);
		assert.equal(parsed.cartId, validCartId);
		assert.equal(parsed.paymentMode, "ONLINE");
		assert.equal(parsed.specialInstructions, "Extra spicy");
	});

	it("should reject unknown field tableId due to strict mode", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			tableId: "c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f",
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

	it("should reject unknown field orderingMode due to strict mode", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			orderingMode: "SELF_ORDER",
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

	it("should reject idempotencyKey in request body due to strict mode", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			idempotencyKey: "header-only-key",
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

	it("should fail validation when cartId is missing", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			paymentMode: "ONLINE",
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

	it("should fail validation when paymentMode is PAY_AT_COUNTER (only ONLINE is supported)", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
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

	it("should fail validation when restaurantId is missing", async () => {
		const payload = {
			cartId: validCartId,
			paymentMode: "ONLINE",
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
			cartId: validCartId,
			paymentMode: "ONLINE",
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
			cartId: validCartId,
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

	it("should fail validation with invalid cartId format", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: "invalid-uuid",
			paymentMode: "ONLINE",
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
			cartId: validCartId,
			paymentMode: "ONLINE",
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

	it("should succeed with valid userName and userPhone in request body", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			userName: "Jane Doe",
			userPhone: "+919876543210",
		};

		const parsed = await placeOrderBodySchema.parseAsync(payload);
		assert.equal(parsed.userName, "Jane Doe");
		assert.equal(parsed.userPhone, "+919876543210");
	});

	it("should fail validation when userPhone format is invalid", async () => {
		const payload = {
			restaurantId: validRestaurantId,
			cartId: validCartId,
			paymentMode: "ONLINE",
			userPhone: "not-a-phone-number",
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
