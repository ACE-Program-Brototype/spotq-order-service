import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderHistoryMapper } from "@application/mappers/orders/order-history.mapper.ts";
import type { GetCustomerOrderHistoryRepoResult } from "@domain/types/order-repository.types";

describe("OrderHistoryMapper", () => {
	it("should map repo results to response DTO correctly", () => {
		const fixedDate = new Date("2026-10-06T13:50:00.000Z");
		const repoResult: GetCustomerOrderHistoryRepoResult = {
			orders: [
				{
					orderId: "ord-1",
					orderNumber: "SQ-101",
					restaurantId: "rest-1",
					orderStatus: "COMPLETED",
					itemsCount: 2,
					grandTotal: 863.0,
					createdAt: fixedDate,
				},
			],
			totalOrders: 24,
			totalPages: 3,
			currentPage: 1,
			hasNext: true,
		};

		const result = OrderHistoryMapper.toDTO(repoResult);

		assert.deepEqual(result, {
			orders: [
				{
					order_id: "ord-1",
					order_number: "SQ-101",
					restaurant_id: "rest-1",
					status: "COMPLETED",
					items_count: 2,
					total_amount: 863.0,
					created_at: "2026-10-06T13:50:00.000Z",
				},
			],
			pagination: {
				current_page: 1,
				total_pages: 3,
				total_orders: 24,
				has_next: true,
			},
		});
	});
});
