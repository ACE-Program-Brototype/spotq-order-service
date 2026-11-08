import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import { staffOrdersListQuerySchema } from "@presentation/http/validators/orders/staff-orders-list-query.schema.ts";

describe("staffOrdersListQuerySchema validation", () => {
	it("should succeed with default values when query is empty", () => {
		const result = staffOrdersListQuerySchema.safeParse({});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 1);
			assert.equal(result.data.limit, 20);
			assert.equal(result.data.sortOrder, "asc");
			assert.equal(result.data.status, undefined);
			assert.equal(result.data.orderType, undefined);
			assert.equal(result.data.search, undefined);
		}
	});

	it("should succeed with valid search string", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			search: "ORD-001",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.search, "ORD-001");
		}
	});

	it("should succeed with a single valid active status", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			status: "PLACED",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.deepEqual(result.data.status, [OrderStatus.PLACED]);
		}
	});

	it("should parse comma-separated valid statuses including COMPLETED", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			status: "PLACED, CONFIRMED, PREPARING, READY, COMPLETED",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.deepEqual(result.data.status, [
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.COMPLETED,
			]);
		}
	});

	it("should succeed with COMPLETED status", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			status: "COMPLETED",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.deepEqual(result.data.status, [OrderStatus.COMPLETED]);
		}
	});

	it("should reject invalid status string", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			status: "INVALID_STATUS",
		});
		assert.equal(result.success, false);
	});

	it("should succeed with supported orderType QUEUE_PRO and SELF_PRO", () => {
		const resQueue = staffOrdersListQuerySchema.safeParse({
			orderType: "QUEUE_PRO",
		});
		assert.equal(resQueue.success, true);
		if (resQueue.success) {
			assert.equal(resQueue.data.orderType, RestaurantPlan.QUEUE_PRO);
		}

		const resSelf = staffOrdersListQuerySchema.safeParse({
			orderType: "SELF_PRO",
		});
		assert.equal(resSelf.success, true);
		if (resSelf.success) {
			assert.equal(resSelf.data.orderType, RestaurantPlan.SELF_PRO);
		}
	});

	it("should reject unsupported orderType", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			orderType: "DELIVERY",
		});
		assert.equal(result.success, false);
	});

	it("should succeed with sortOrder asc and desc", () => {
		const resAsc = staffOrdersListQuerySchema.safeParse({
			sortOrder: "asc",
		});
		assert.equal(resAsc.success, true);
		if (resAsc.success) {
			assert.equal(resAsc.data.sortOrder, "asc");
		}

		const resDesc = staffOrdersListQuerySchema.safeParse({
			sortOrder: "desc",
		});
		assert.equal(resDesc.success, true);
		if (resDesc.success) {
			assert.equal(resDesc.data.sortOrder, "desc");
		}
	});

	it("should reject invalid sortOrder", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			sortOrder: "invalid",
		});
		assert.equal(result.success, false);
	});

	it("should coerce valid page and limit values", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			page: "2",
			limit: "50",
		});
		assert.equal(result.success, true);
		if (result.success) {
			assert.equal(result.data.page, 2);
			assert.equal(result.data.limit, 50);
		}
	});

	it("should reject non-positive page", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			page: "0",
		});
		assert.equal(result.success, false);
	});

	it("should reject limit exceeding 100", () => {
		const result = staffOrdersListQuerySchema.safeParse({
			limit: "101",
		});
		assert.equal(result.success, false);
	});
});
