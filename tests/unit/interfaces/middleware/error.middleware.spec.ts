import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	CART_MESSAGES,
} from "@common/constants/message.constants.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import {
	errorHandler,
	mapDomainErrorToHttpStatus,
} from "@interfaces/middleware/error.middleware.ts";
import type { Request, Response } from "express";

describe("Error Middleware", () => {
	it("should map domain error codes to correct HTTP status codes", () => {
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_NOT_FOUND),
			HTTP_STATUS.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_EXPIRED),
			HTTP_STATUS.GONE,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.FORBIDDEN_CART_ACCESS),
			HTTP_STATUS.FORBIDDEN,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART),
			HTTP_STATUS.CONFLICT,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.ITEM_UNAVAILABLE),
			HTTP_STATUS.CONFLICT,
		);
	});

	it("should format response correctly when handling DomainError", () => {
		const err = new CartNotFoundError();
		const req = {} as Request;
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

		errorHandler(err, req, res, () => {});

		assert.equal(capturedStatus, HTTP_STATUS.NOT_FOUND);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HTTP_STATUS.NOT_FOUND,
			code: CART_ERROR_CODES.CART_NOT_FOUND,
			message: CART_MESSAGES.NOT_FOUND,
			error: undefined,
		});
	});

	it("should handle generic Error with 500 Internal Server Error", () => {
		const err = new Error("Database explosion");
		const req = {} as Request;
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

		errorHandler(err, req, res, () => {});

		assert.equal(capturedStatus, HTTP_STATUS.INTERNAL_SERVER_ERROR);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
			code: CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
			message: "Database explosion",
			error: undefined,
		});
	});
});
