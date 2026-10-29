import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import { AUTH_HEADERS, AUTH_ROLES } from "@shared/constants/auth.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import {
	messages,
	ORDER_ERROR_CODES,
} from "@shared/constants/message.constants.ts";
import { ForbiddenError, UnauthorizedError } from "@shared/errors/index.ts";
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

	it("should throw UnauthorizedError when x-user-id header is missing", () => {
		const req = {
			headers: {},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		assert.throws(
			() => customerAuthMiddleware(req, res, next),
			(err: unknown) => {
				assert.ok(err instanceof UnauthorizedError);
				assert.equal(err.statusCode, HttpStatus.UNAUTHORIZED);
				assert.equal(err.errorCode, ORDER_ERROR_CODES.UNAUTHORIZED);
				assert.equal(err.message, messages.UNAUTHORIZED);
				return true;
			},
		);
		assert.equal(nextCalled, false);
	});

	it("should throw UnauthorizedError when x-user-id header is empty whitespace", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "   ",
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		assert.throws(
			() => customerAuthMiddleware(req, res, next),
			(err: unknown) => {
				assert.ok(err instanceof UnauthorizedError);
				assert.equal(err.statusCode, HttpStatus.UNAUTHORIZED);
				assert.equal(err.errorCode, ORDER_ERROR_CODES.UNAUTHORIZED);
				assert.equal(err.message, messages.UNAUTHORIZED);
				return true;
			},
		);
		assert.equal(nextCalled, false);
	});

	it("should throw ForbiddenError when user has a forbidden role like PLATFORM_ADMIN", () => {
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "admin-999",
				[AUTH_HEADERS.USER_ROLE]: "PLATFORM_ADMIN",
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		assert.throws(
			() => customerAuthMiddleware(req, res, next),
			(err: unknown) => {
				assert.ok(err instanceof ForbiddenError);
				assert.equal(err.statusCode, HttpStatus.FORBIDDEN);
				assert.equal(err.errorCode, ORDER_ERROR_CODES.FORBIDDEN);
				assert.equal(err.message, messages.FORBIDDEN);
				return true;
			},
		);
		assert.equal(nextCalled, false);
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
