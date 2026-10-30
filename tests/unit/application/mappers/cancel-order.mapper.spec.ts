import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CancelOrderMapper } from "@application/mappers/orders/cancel-order.mapper.ts";
import type { CancelledOrderData } from "@domain/types/order-repository.types";

describe("CancelOrderMapper", () => {
	it("should map CancelledOrderData to CancelOrderResponseDto correctly", () => {
		const fixedDate = new Date("2026-10-06T13:52:00.000Z");
		const cancelledData: CancelledOrderData = {
			orderId: "ord_992817203",
			orderNumber: "SQ-101",
			status: "CANCELLED",
			cancellationReason: "Changed my mind",
			cancelledAt: fixedDate,
		};

		const result = CancelOrderMapper.toDTO(cancelledData);

		assert.deepEqual(result, {
			order_id: "ord_992817203",
			order_number: "SQ-101",
			status: "CANCELLED",
			cancellation_reason: "Changed my mind",
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should handle null cancellation reason correctly", () => {
		const fixedDate = new Date("2026-10-06T13:52:00.000Z");
		const cancelledData: CancelledOrderData = {
			orderId: "ord_992817203",
			orderNumber: "SQ-101",
			status: "CANCELLED",
			cancellationReason: null,
			cancelledAt: fixedDate,
		};

		const result = CancelOrderMapper.toDTO(cancelledData);

		assert.deepEqual(result, {
			order_id: "ord_992817203",
			order_number: "SQ-101",
			status: "CANCELLED",
			cancellation_reason: null,
			cancelled_at: "2026-10-06T13:52:00.000Z",
		});
	});

	it("should defensively handle null cancelledAt without throwing TypeError", () => {
		const cancelledData: CancelledOrderData = {
			orderId: "ord_992817203",
			orderNumber: "SQ-101",
			status: "CANCELLED",
			cancellationReason: null,
			cancelledAt: null,
		};

		const result = CancelOrderMapper.toDTO(cancelledData);

		assert.equal(result.order_id, "ord_992817203");
		assert.equal(result.order_number, "SQ-101");
		assert.equal(result.status, "CANCELLED");
		assert.equal(typeof result.cancelled_at, "string");
		assert.ok(!Number.isNaN(Date.parse(result.cancelled_at)));
	});
});
