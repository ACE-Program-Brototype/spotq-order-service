import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { AUTH_HEADERS, AUTH_ROLES } from "@common/constants/auth.constants.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { messages } from "@common/constants/message.constants.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import type { Request, Response } from "express";

function createMockResponse() {
	let respondedStatus = 0;
	let responseBody: unknown = null;
	const res = {
		status: (code: number) => {
			respondedStatus = code;
			return res;
		},
		json: (body: unknown) => {
			responseBody = body;
			return res;
		},
	} as unknown as Response;
	return { res, getStatus: () => respondedStatus, getBody: () => responseBody };
}

describe("customerAuthMiddleware", () => {
	it("should allow request with valid customer headers", () => {
		let nextCalled = false;
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "cust-123",
				[AUTH_HEADERS.USER_ROLE]: AUTH_ROLES.CUSTOMER,
				[AUTH_HEADERS.USER_EMAIL]: "customer@example.com",
			},
		} as unknown as Request;

		const { res } = createMockResponse();

		customerAuthMiddleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "cust-123",
			role: "CUSTOMER",
			email: "customer@example.com",
		});
	});

	it("should return 403 Forbidden when user has a forbidden role like PLATFORM_ADMIN", () => {
		let nextCalled = false;
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "admin-999",
				[AUTH_HEADERS.USER_ROLE]: "PLATFORM_ADMIN",
			},
		} as unknown as Request;

		const { res, getStatus, getBody } = createMockResponse();

		customerAuthMiddleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, false);
		assert.equal(getStatus(), HTTP_STATUS.FORBIDDEN);
		const body = getBody() as { message: string };
		assert.equal(body.message, messages.FORBIDDEN);
	});

	it("should allow request with lowercase customer role header", () => {
		let nextCalled = false;
		const req = {
			headers: {
				[AUTH_HEADERS.USER_ID]: "cust-123",
				[AUTH_HEADERS.USER_ROLE]: "customer",
				[AUTH_HEADERS.USER_EMAIL]: "customer@example.com",
			},
		} as unknown as Request;

		const { res } = createMockResponse();

		customerAuthMiddleware(req, res, () => {
			nextCalled = true;
		});

		assert.equal(nextCalled, true);
		assert.deepEqual(req.user, {
			userId: "cust-123",
			role: "customer",
			email: "customer@example.com",
		});
	});
});
