import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CustomerOrderDetailsMapper } from "@application/mappers/orders/customer-order-details.mapper.ts";
import { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { OrderingMode } from "@domain/enums/ordering-mode.enum.ts";
import { PaymentMode } from "@domain/enums/payment-mode.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";

describe("CustomerOrderDetailsMapper", () => {
	it("should correctly map Order domain entity to GetCustomerOrderDetailsOutputDTO", () => {
		const orderDate = new Date("2026-10-06T13:50:00.000Z");
		const updateDate = new Date("2026-10-06T14:15:00.000Z");

		const order = new Order({
			id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			orderNumber: "SQ-101",
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			restaurantName: "Spice Garden Cafe",
			restaurantPlan: RestaurantPlan.SELF_PRO,
			userId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
			userName: "Alice Smith",
			userPhone: "+919876543210",
			tableNumber: 12,
			queueEntryId: null,
			orderingMode: OrderingMode.SELF_ORDER,
			paymentMode: PaymentMode.ONLINE,
			paymentStatus: PaymentStatus.PAID,
			orderStatus: OrderStatus.COMPLETED,
			subtotal: 600,
			taxAmount: 30,
			platformFee: 2,
			discountAmount: 0,
			grandTotal: 632,
			specialInstructions: "Please do not add onions",
			createdAt: orderDate,
			updatedAt: updateDate,
			items: [
				{
					id: "item-ord-1",
					menuItemId: "item-101",
					itemName: "Paneer Biryani",
					quantity: 2,
					unitPrice: 280,
					variantId: "var-1",
					variantName: "Regular",
					totalPrice: 600,
					addons: [
						{
							addonId: "addon-1",
							addonName: "Extra Raita",
							price: 20,
						},
					],
				},
				{
					id: "item-ord-2",
					menuItemId: "item-102",
					itemName: "Gulab Jamun",
					quantity: 1,
					unitPrice: 50,
					variantId: null,
					variantName: null,
					totalPrice: 50,
					addons: [],
				},
			],
			statusHistory: [
				{
					id: "sh-1",
					orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
					previousStatus: null,
					currentStatus: OrderStatus.PLACED,
					changedBy: "cust-owner",
					notes: "Order placed",
					createdAt: orderDate,
				},
				{
					id: "sh-2",
					orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
					previousStatus: OrderStatus.PLACED,
					currentStatus: OrderStatus.COMPLETED,
					changedBy: "staff-1",
					notes: null,
					createdAt: updateDate,
				},
			],
		});

		const result = CustomerOrderDetailsMapper.toResponseDTO(order);

		assert.equal(result.order.order_id, "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11");
		assert.equal(result.order.order_number, "SQ-101");
		assert.equal(
			result.order.restaurant.restaurant_id,
			"b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
		);
		assert.equal(result.order.restaurant.name, "Spice Garden Cafe");
		assert.equal(result.order.order_type, OrderingMode.SELF_ORDER);
		assert.equal(result.order.status, OrderStatus.COMPLETED);
		assert.equal(result.order.created_at, orderDate.toISOString());
		assert.equal(result.order.updated_at, updateDate.toISOString());
		assert.equal(result.order.table_number, 12);
		assert.equal(result.order.queue_entry_id, null);
		assert.equal(result.order.special_instructions, "Please do not add onions");

		// Pricing verification
		assert.deepEqual(result.order.pricing, {
			subtotal: 600,
			discounts: 0,
			taxes: 30,
			platform_fee: 2,
			grand_total: 632,
			currency: "INR",
		});

		// Payment verification
		assert.deepEqual(result.order.payment, {
			status: PaymentStatus.PAID,
			method: PaymentMode.ONLINE,
			payment_id: null,
			amount_paid: 632,
		});

		// Items verification with addons and variants
		assert.equal(result.order.items.length, 2);

		const firstItem = result.order.items[0];
		assert.equal(firstItem?.menu_item_id, "item-101");
		assert.equal(firstItem?.name, "Paneer Biryani");
		assert.equal(firstItem?.quantity, 2);
		assert.equal(firstItem?.unit_price, 280);
		assert.deepEqual(firstItem?.variant, {
			variant_id: "var-1",
			name: "Regular",
		});
		assert.deepEqual(firstItem?.addons, [
			{
				addon_id: "addon-1",
				name: "Extra Raita",
				price: 20,
			},
		]);
		assert.equal(firstItem?.line_total, 600);

		const secondItem = result.order.items[1];
		assert.equal(secondItem?.menu_item_id, "item-102");
		assert.equal(secondItem?.name, "Gulab Jamun");
		assert.equal(secondItem?.quantity, 1);
		assert.equal(secondItem?.unit_price, 50);
		assert.equal(secondItem?.variant, null);
		assert.deepEqual(secondItem?.addons, []);
		assert.equal(secondItem?.line_total, 50);

		// Status history verification
		assert.deepEqual(result.order.status_history, [
			{
				previous_status: null,
				current_status: OrderStatus.PLACED,
				notes: "Order placed",
				created_at: orderDate.toISOString(),
			},
			{
				previous_status: OrderStatus.PLACED,
				current_status: OrderStatus.COMPLETED,
				notes: null,
				created_at: updateDate.toISOString(),
			},
		]);
	});
});
