import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { restaurantStaffAuthMiddleware } from "@presentation/http/middleware/restaurant-staff-auth.middleware.ts";
import { AUTH_HEADERS, AUTH_ROLES } from "@shared/constants/auth.constants.ts";
import { COMMON_ERROR_CODES } from "@shared/constants/error-code.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import {
	ORDER_ERROR_CODES,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
import type { NextFunction, Request, Response } from "express";

describe("Restaurant Staff Auth Middleware", () => {
	function createMockResponse() {
		let capturedStatus = 0;
		let capturedBody: unknown = null;

		const res = {
			status: (code: number) => {
				capturedStatus = code;
				return res;
			},
			json: (body: unknown) => {
				capturedBody = body;
				return res;
			},
		} as unknown as Response;

		return {
			res,
			getStatus: () => capturedStatus,
			getBody: () => capturedBody as { message?: string; code?: string },
		};
	}

	it("should authenticate successfully when valid headers are provided with role 'staff'", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "staff-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: "staff",
				[AUTH_HEADERS.USER_EMAIL]: "staff@restaurant.com",
			},
			params: {},
		} as unknown as Request;

		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "staff-1",
			restaurantId: "rest-1",
			role: "staff",
			email: "staff@restaurant.com",
		});
	});

	it("should authenticate successfully case-insensitively with 'STAFF'", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "staff-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: "STAFF",
			},
			params: {},
		} as unknown as Request;

		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.equal(req.user?.userId, "staff-1");
		assert.equal(req.user?.restaurantId, "rest-1");
	});

	it("should return 401 when x-user-id or x-restaurant-id header is missing", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ROLE]: "staff",
			},
			params: {},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HttpStatus.UNAUTHORIZED);
		assert.equal(getBody().code, COMMON_ERROR_CODES.UNAUTHORIZED);
	});

	it("should return 403 when role is not staff (e.g. CUSTOMER)", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "cust-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: AUTH_ROLES.CUSTOMER,
			},
			params: {},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HttpStatus.FORBIDDEN);
		assert.equal(getBody().code, ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS);
	});

	it("should return 403 when role is RESTAURANT_OWNER because this middleware is strictly for staff", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "owner-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: AUTH_ROLES.RESTAURANT_OWNER,
				[AUTH_HEADERS.USER_EMAIL]: "owner@restaurant.com",
			},
			params: {},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HttpStatus.FORBIDDEN);
		assert.equal(getBody().code, ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS);
	});

	it("should return 403 when role is neither staff nor valid role (e.g. unknown role)", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "guest-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: "guest",
			},
			params: {},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HttpStatus.FORBIDDEN);
		assert.equal(getBody().code, ORDER_ERROR_CODES.FORBIDDEN_RESTAURANT_ACCESS);
	});

	it("should return 403 when req.params.restaurantId does not match user restaurantId", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "staff-1",
				[AUTH_HEADERS.RESTAURANT_ID]: "rest-1",
				[AUTH_HEADERS.USER_ROLE]: "staff",
			},
			params: {
				restaurantId: "different-restaurant",
			},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		restaurantStaffAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HttpStatus.FORBIDDEN);
		assert.equal(getBody().message, ORDER_MESSAGES.FORBIDDEN_RESTAURANT_ACCESS);
	});
});
