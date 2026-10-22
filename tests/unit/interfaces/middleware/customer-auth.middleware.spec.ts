import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUTH_HEADERS, AUTH_ROLES } from "@common/constants/auth.constants.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	messages,
} from "@common/constants/message.constants.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import type { NextFunction, Request, Response } from "express";

describe("Customer Auth Middleware", () => {
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
			getBody: () => capturedBody,
		};
	}

	it("should return 401 when x-user-id header is missing", () => {
		const req = {
			headers: {},
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HTTP_STATUS.UNAUTHORIZED);
		assert.deepEqual(getBody(), {
			success: false,
			statusCode: HTTP_STATUS.UNAUTHORIZED,
			code: CART_ERROR_CODES.UNAUTHORIZED,
			message: messages.UNAUTHORIZED,
			error: undefined,
		});
	});

	it("should return 401 when x-user-id header is empty whitespace", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "   ",
			},
		} as unknown as Request;
		const { res, getStatus } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HTTP_STATUS.UNAUTHORIZED);
	});

	it("should return 403 Forbidden when user has a forbidden role like PLATFORM_ADMIN", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "admin-999",
				[AUTH_HEADERS.USER_ROLE]: "PLATFORM_ADMIN",
			},
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HTTP_STATUS.FORBIDDEN);
		const body = getBody() as { message: string };
		assert.equal(body.message, messages.FORBIDDEN);
	});

	it("should allow request with lowercase customer role header", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "cust-123",
				[AUTH_HEADERS.USER_ROLE]: "customer",
				[AUTH_HEADERS.USER_EMAIL]: "customer@example.com",
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "cust-123",
			role: "customer",
			email: "customer@example.com",
			name: undefined,
			phone: undefined,
		});
	});

	it("should assign headers to req.user and call next when headers are present", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "user-1234",
				[AUTH_HEADERS.USER_ROLE]: AUTH_ROLES.CUSTOMER,
				[AUTH_HEADERS.USER_EMAIL]: "user@example.com",
				[AUTH_HEADERS.USER_NAME]: "John Doe",
				[AUTH_HEADERS.USER_PHONE]: "+919876543210",
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "user-1234",
			role: AUTH_ROLES.CUSTOMER,
			email: "user@example.com",
			name: "John Doe",
			phone: "+919876543210",
		});
	});

	it("should handle optional headers omitted gracefully", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "user-9999",
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "user-9999",
			role: undefined,
			email: undefined,
			name: undefined,
			phone: undefined,
		});
	});

	it("should handle array header value properly", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: ["user-array-1", "user-array-2"],
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		customerAuthMiddleware(req, res, next);

		assert.equal(nextCalled, true);
		assert.equal(req.user?.userId, "user-array-1");
	});
});
