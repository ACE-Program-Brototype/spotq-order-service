import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addCartItemBodySchema } from "@interfaces/validation/add-cart-item.schema.ts";

describe("addCartItemBodySchema validation", () => {
	const validPayload = {
		restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
		menuItemId: "3f2a1b00-55de-4d39-a9a7-9f6b986e8123",
		variantId: "9a8b7c6d-1111-4222-b333-c44455566677",
		addonIds: ["77aa88bb-99cc-4dde-aff0-1234567890ab"],
		quantity: 2,
		specialInstructions: "Less spicy, crispy crust",
	};

	it("should succeed with a valid request body", () => {
		const parsed = addCartItemBodySchema.parse(validPayload);
		assert.equal(parsed.restaurantId, validPayload.restaurantId);
		assert.equal(parsed.menuItemId, validPayload.menuItemId);
		assert.equal(parsed.quantity, 2);
	});

	it("should fail validation with invalid restaurantId format", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				restaurantId: "invalid-uuid",
			});
		});
	});

	it("should fail validation with invalid menuItemId format", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				menuItemId: "invalid-uuid",
			});
		});
	});

	it("should fail validation when quantity is less than 1", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				quantity: 0,
			});
		});
	});

	it("should fail validation when quantity is greater than 20", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				quantity: 21,
			});
		});
	});

	it("should fail validation when quantity is a float", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				quantity: 2.5,
			});
		});
	});

	it("should fail validation when specialInstructions exceed 250 characters", () => {
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				specialInstructions: "a".repeat(251),
			});
		});
	});

	it("should succeed with optional fields omitted", () => {
		const minimal = {
			restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			menuItemId: "3f2a1b00-55de-4d39-a9a7-9f6b986e8123",
			quantity: 1,
		};
		const parsed = addCartItemBodySchema.parse(minimal);
		assert.equal(parsed.quantity, 1);
		assert.deepEqual(parsed.addonIds, []);
	});

	it("should fail validation when addonIds contains duplicate IDs", () => {
		const duplicateId = "77aa88bb-99cc-4dde-aff0-1234567890ab";
		assert.throws(() => {
			addCartItemBodySchema.parse({
				...validPayload,
				addonIds: [duplicateId, duplicateId],
			});
		});
	});
});
