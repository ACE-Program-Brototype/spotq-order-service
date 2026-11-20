import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StaffOrderDetailsMapper } from "@application/mappers/orders/staff-order-details.mapper.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";

describe("StaffOrderDetailsMapper", () => {
	it("should map a complete order with variants, addons, instructions, and customer notes", () => {
		const fixedDate = new Date("2026-10-06T13:50:00.000Z");

		const order = new Order({
			id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			orderNumber: "SQ-101",
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PENDING,
			orderStatus: OrderStatus.PLACED,
			specialInstructions: "Please provide extra napkins.",
			createdAt: fixedDate,
			items: [
				{
					menuItemId: "item-pizza-01",
					itemName: "Margherita Pizza",
					variantId: "var-large-12",
					variantName: "Large (12 inch)",
					quantity: 2,
					unitPrice: 15.0,
					specialInstructions: "Less spicy please",
					addons: [
						{
							addonId: "add-extra-cheese",
							addonName: "Extra Cheese",
							price: 2.5,
						},
					],
				},
			],
		});

		const result = StaffOrderDetailsMapper.toDTO(order);

		assert.deepEqual(result, {
			order_id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			order_number: "SQ-101",
			status: OrderStatus.PLACED,
			customer_notes: "Please provide extra napkins.",
			items: [
				{
					menu_item_id: "item-pizza-01",
					name: "Margherita Pizza",
					variant_id: "var-large-12",
					variant_name: "Large (12 inch)",
					addons: [
						{
							addon_id: "add-extra-cheese",
							name: "Extra Cheese",
						},
					],
					quantity: 2,
					special_instructions: "Less spicy please",
				},
			],
			created_at: "2026-10-06T13:50:00.000Z",
		});
	});

	it("should return null for missing optional fields and empty array for items with no addons", () => {
		const fixedDate = new Date("2026-10-06T14:00:00.000Z");

		const order = new Order({
			id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			orderNumber: "SQ-102",
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PAID,
			orderStatus: OrderStatus.CONFIRMED,
			specialInstructions: null,
			createdAt: fixedDate,
			items: [
				{
					menuItemId: "item-drink-01",
					itemName: "Fresh Lime Soda",
					variantId: null,
					variantName: null,
					quantity: 1,
					unitPrice: 5.0,
					specialInstructions: undefined,
					addons: [],
				},
			],
		});

		const result = StaffOrderDetailsMapper.toDTO(order);

		assert.equal(result.customer_notes, null);
		assert.equal(result.items.length, 1);
		assert.equal(result.items[0]?.variant_id, null);
		assert.equal(result.items[0]?.variant_name, null);
		assert.equal(result.items[0]?.special_instructions, null);
		assert.deepEqual(result.items[0]?.addons, []);
	});

	it("should normalize whitespace-only customer notes or special instructions to null", () => {
		const fixedDate = new Date("2026-10-06T14:30:00.000Z");

		const order = new Order({
			id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			orderNumber: "SQ-103",
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PAID,
			orderStatus: OrderStatus.PREPARING,
			specialInstructions: "   ",
			createdAt: fixedDate,
			items: [
				{
					menuItemId: "item-fries-01",
					itemName: "French Fries",
					variantId: null,
					variantName: null,
					quantity: 1,
					unitPrice: 4.0,
					specialInstructions: "   ",
					addons: [],
				},
			],
		});

		const result = StaffOrderDetailsMapper.toDTO(order);

		assert.equal(result.customer_notes, null);
		assert.equal(result.items[0]?.special_instructions, null);
	});
});
