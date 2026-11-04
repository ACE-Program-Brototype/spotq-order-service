import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { GetRestaurantOrdersListMapper } from "@application/mappers/orders/get-restaurant-orders.mapper.ts";
import type { GetRestaurantOrdersRepoResult } from "@domain/types/order-repository.types";

describe("GetRestaurantOrdersListMapper", () => {
	it("should map repo results into response DTO with nested pagination object", () => {
		const fixedDate = new Date("2026-11-04T10:00:00.000Z");
		const repoResult: GetRestaurantOrdersRepoResult = {
			orders: [
				{
					orderId: "ord-3dc35-001",
					orderNumber: "ORD-3DC35-001",
					orderStatus: "COMPLETED",
					itemsCount: 3,
					grandTotal: 39.3,
					createdAt: fixedDate,
				},
				{
					orderId: "ord-3dc35-002",
					orderNumber: "ORD-3DC35-002",
					orderStatus: "PLACED",
					itemsCount: 2,
					grandTotal: 21.48,
					createdAt: fixedDate,
				},
			],
			totalOrders: 10,
			totalPages: 1,
			currentPage: 1,
			hasNext: false,
		};

		const result = GetRestaurantOrdersListMapper.toDTO(repoResult);

		assert.deepEqual(result, {
			orders: [
				{
					orderId: "ord-3dc35-001",
					orderNumber: "ORD-3DC35-001",
					orderStatus: "COMPLETED",
					itemsCount: 3,
					grandTotal: 39.3,
					createdAt: fixedDate,
				},
				{
					orderId: "ord-3dc35-002",
					orderNumber: "ORD-3DC35-002",
					orderStatus: "PLACED",
					itemsCount: 2,
					grandTotal: 21.48,
					createdAt: fixedDate,
				},
			],
			pagination: {
				totalOrders: 10,
				totalPages: 1,
				currentPage: 1,
				hasNext: false,
			},
		});
	});
});
