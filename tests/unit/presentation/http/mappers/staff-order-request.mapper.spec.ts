import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { StaffOrderRequestMapper } from "@presentation/http/mappers/staff-order-request.mapper.ts";
import { AUTH_ROLES } from "@shared/constants/auth.constants.ts";
import type { Request } from "express";

describe("StaffOrderRequestMapper", () => {
	it("should map request params to GetStaffOrderDetailsInputDTO correctly", () => {
		const req = {
			params: {
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
				orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			},
		} as unknown as Request;

		const result = StaffOrderRequestMapper.toGetStaffOrderDetailsInputDto(req);

		assert.deepEqual(result, {
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
		});
	});

	it("should map request params, body, and auth user to UpdateOrderStatusInputDTO correctly", () => {
		const req = {
			params: {
				orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			},
			body: {
				status: OrderStatus.PREPARING,
				notes: "Starting pizza preparation",
			},
			user: {
				userId: "staff-123",
				restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
				role: AUTH_ROLES.STAFF,
			},
		} as unknown as Request;

		const result = StaffOrderRequestMapper.toUpdateOrderStatusInputDto(req);

		assert.deepEqual(result, {
			orderId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
			status: OrderStatus.PREPARING,
			restaurantId: "b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
			actorId: "staff-123",
			notes: "Starting pizza preparation",
		});
	});
});
