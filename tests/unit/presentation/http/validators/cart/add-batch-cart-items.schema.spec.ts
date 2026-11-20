import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addBatchCartItemsBodySchema } from "@presentation/http/validators/cart/add-batch-cart-items.schema.ts";

describe("addBatchCartItemsBodySchema", () => {
	const validRestaurantId = "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345";
	const validMenuItemId = "01e2f3a4-1234-4a2e-8e55-321456987010";
	const validVariantId = "01e2f3a4-1234-4a2e-8e55-321456987020";
	const validAddonId = "01e2f3a4-1234-4a2e-8e55-321456987030";

	it("should accept a valid batch payload", () => {
		const parsed = addBatchCartItemsBodySchema.safeParse({
			restaurantId: validRestaurantId,
			items: [
				{
					menuItemId: validMenuItemId,
					variantId: validVariantId,
					addonIds: [validAddonId],
					quantity: 2,
					specialInstructions: "Extra spicy",
				},
				{
					menuItemId: "01e2f3a4-1234-4a2e-8e55-321456987040",
					variantId: null,
					quantity: 1,
					specialInstructions: null,
				},
			],
		});

		assert.equal(parsed.success, true);
		if (parsed.success) {
			assert.equal(parsed.data.items.length, 2);
			assert.deepEqual(parsed.data.items[1]?.addonIds, []);
		}
	});

	it("should reject empty items array", () => {
		const parsed = addBatchCartItemsBodySchema.safeParse({
			restaurantId: validRestaurantId,
			items: [],
		});
		assert.equal(parsed.success, false);
	});

	it("should reject more than 50 items", () => {
		const items = Array.from({ length: 51 }, () => ({
			menuItemId: validMenuItemId,
			quantity: 1,
		}));
		const parsed = addBatchCartItemsBodySchema.safeParse({
			restaurantId: validRestaurantId,
			items,
		});
		assert.equal(parsed.success, false);
	});

	it("should reject unknown fields such as cartId due to strict mode", () => {
		const parsed = addBatchCartItemsBodySchema.safeParse({
			restaurantId: validRestaurantId,
			cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
			items: [
				{
					menuItemId: validMenuItemId,
					quantity: 1,
				},
			],
		});
		assert.equal(parsed.success, false);
	});

	it("should reject duplicate addonIds within an item", () => {
		const parsed = addBatchCartItemsBodySchema.safeParse({
			restaurantId: validRestaurantId,
			items: [
				{
					menuItemId: validMenuItemId,
					addonIds: [validAddonId, validAddonId],
					quantity: 1,
				},
			],
		});
		assert.equal(parsed.success, false);
	});
});
