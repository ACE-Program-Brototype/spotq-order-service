import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { orderDetailsParamSchema } from "@presentation/http/validators/orders/order-details-param.schema.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";

describe("orderDetailsParamSchema validation", () => {
	const validRestaurantId = "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22";
	const validOrderId = "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11";

	it("should succeed with valid restaurantId and orderId UUIDs", () => {
		const result = orderDetailsParamSchema.safeParse({
			restaurantId: validRestaurantId,
			orderId: validOrderId,
		});

		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.restaurantId, validRestaurantId);
			assert.equal(result.data.orderId, validOrderId);
		}
	});

	it("should fail validation when restaurantId is not a valid UUID format", () => {
		const result = orderDetailsParamSchema.safeParse({
			restaurantId: "invalid-restaurant-uuid",
			orderId: validOrderId,
		});

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_RESTAURANT_ID,
			);
		}
	});

	it("should fail validation when orderId is not a valid UUID format", () => {
		const result = orderDetailsParamSchema.safeParse({
			restaurantId: validRestaurantId,
			orderId: "invalid-order-uuid",
		});

		assert.equal(result.success, false);
		if (!result.success) {
			assert.equal(
				result.error.issues[0]?.message,
				ORDER_MESSAGES.INVALID_ORDER_ID,
			);
		}
	});

	it("should fail validation when restaurantId is missing", () => {
		const result = orderDetailsParamSchema.safeParse({
			orderId: validOrderId,
		});

		assert.equal(result.success, false);
	});

	it("should fail validation when orderId is missing", () => {
		const result = orderDetailsParamSchema.safeParse({
			restaurantId: validRestaurantId,
		});

		assert.equal(result.success, false);
	});

	it("should reject unexpected fields because schema is strict", () => {
		const result = orderDetailsParamSchema.safeParse({
			restaurantId: validRestaurantId,
			orderId: validOrderId,
			extraField: "disallowed",
		});

		assert.equal(result.success, false);
	});
});
