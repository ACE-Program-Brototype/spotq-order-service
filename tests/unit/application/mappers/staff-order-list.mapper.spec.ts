import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StaffOrderListMapper } from "@application/mappers/orders/staff-order-list.mapper.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import type { GetStaffOrdersRepoResult } from "@domain/types/order-repository.types.ts";

describe("StaffOrderListMapper", () => {
	it("should map QUEUE_PRO and SELF_PRO orders correctly with items, context, and pagination", () => {
		const repoResult: GetStaffOrdersRepoResult = {
			orders: [
				{
					id: "ord-1",
					orderNumber: "ORD-001",
					orderType: RestaurantPlan.QUEUE_PRO,
					status: OrderStatus.PLACED,
					createdAt: new Date("2026-10-26T10:30:00.000Z"),
					queueEntryId: "q-token-123",
					items: [
						{
							menuItemId: "item-1",
							name: "Veg Burger",
							quantity: 2,
							variantId: "var-1",
							variantName: "Medium",
							addons: [
								{ id: "mod-1", name: "Extra Cheese" },
								{ id: "mod-2", name: "Jalapenos" },
							],
						},
					],
				},
				{
					id: "ord-2",
					orderNumber: "ORD-002",
					orderType: RestaurantPlan.SELF_PRO,
					status: OrderStatus.CONFIRMED,
					createdAt: new Date("2026-10-26T10:32:00.000Z"),
					queueEntryId: null,
					items: [
						{
							menuItemId: "item-2",
							name: "Cold Coffee",
							quantity: 1,
							variantId: null,
							variantName: null,
							addons: [],
						},
					],
				},
			],
			totalOrders: 2,
			totalPages: 1,
			currentPage: 1,
			limit: 20,
			hasNext: false,
		};

		const dto = StaffOrderListMapper.toDTO(repoResult);

		assert.equal(dto.orders.length, 2);

		// Order 1 (QUEUE_PRO)
		const order1 = dto.orders[0];
		assert.ok(order1);
		assert.equal(order1.id, "ord-1");
		assert.equal(order1.orderNumber, "ORD-001");
		assert.equal(order1.orderType, "QUEUE_PRO");
		assert.equal(order1.status, "PLACED");
		assert.equal(order1.createdAt, "2026-10-26T10:30:00.000Z");
		assert.equal(order1.queueId, "q-token-123");
		assert.equal(order1.items.length, 1);
		assert.ok(order1.items[0]);
		assert.deepEqual(order1.items[0], {
			menuItemId: "item-1",
			name: "Veg Burger",
			quantity: 2,
			variant: { id: "var-1", name: "Medium" },
			addons: [
				{ id: "mod-1", name: "Extra Cheese" },
				{ id: "mod-2", name: "Jalapenos" },
			],
		});

		// Order 2 (SELF_PRO)
		const order2 = dto.orders[1];
		assert.ok(order2);
		assert.equal(order2.id, "ord-2");
		assert.equal(order2.orderNumber, "ORD-002");
		assert.equal(order2.orderType, "SELF_PRO");
		assert.equal(order2.status, "CONFIRMED");
		assert.equal(order2.createdAt, "2026-10-26T10:32:00.000Z");
		assert.equal(order2.queueId, null);
		assert.equal(order2.items.length, 1);
		assert.ok(order2.items[0]);
		assert.deepEqual(order2.items[0], {
			menuItemId: "item-2",
			name: "Cold Coffee",
			quantity: 1,
			variant: null,
			addons: [],
		});

		// Pagination
		assert.deepEqual(dto.pagination, {
			page: 1,
			limit: 20,
			total: 2,
			totalPages: 1,
		});
	});

	it("should handle missing optional queue metadata gracefully", () => {
		const repoResult: GetStaffOrdersRepoResult = {
			orders: [
				{
					id: "ord-3",
					orderNumber: "ORD-003",
					orderType: RestaurantPlan.QUEUE_PRO,
					status: OrderStatus.PREPARING,
					createdAt: new Date("2026-10-26T10:35:00.000Z"),
					queueEntryId: null,
					items: [],
				},
				{
					id: "ord-4",
					orderNumber: "ORD-004",
					orderType: RestaurantPlan.SELF_PRO,
					status: OrderStatus.READY,
					createdAt: new Date("2026-10-26T10:36:00.000Z"),
					queueEntryId: null,
					items: [],
				},
			],
			totalOrders: 2,
			totalPages: 1,
			currentPage: 1,
			limit: 20,
			hasNext: false,
		};

		const dto = StaffOrderListMapper.toDTO(repoResult);
		const firstOrder = dto.orders[0];
		const secondOrder = dto.orders[1];
		assert.ok(firstOrder);
		assert.ok(secondOrder);
		assert.equal(firstOrder.queueId, null);
		assert.equal(secondOrder.queueId, null);
	});
});
