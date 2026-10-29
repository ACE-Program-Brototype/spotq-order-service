import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import {
	errorHandler,
	mapDomainErrorToHttpStatus,
} from "@presentation/http/middleware/error.middleware.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import {
	CART_ERROR_CODES,
	CART_MESSAGES,
	messages,
	ORDER_ERROR_CODES,
} from "@shared/constants/message.constants.ts";
import { ForbiddenError, UnauthorizedError } from "@shared/errors/index.ts";
import type { Request, Response } from "express";

describe("Error Middleware", () => {
	it("should map domain error codes to correct HTTP status codes", () => {
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_NOT_FOUND),
			HttpStatus.NOT_FOUND,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.CART_EXPIRED),
			HttpStatus.GONE,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.FORBIDDEN_CART_ACCESS),
			HttpStatus.FORBIDDEN,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.DIFFERENT_RESTAURANT_CART),
			HttpStatus.CONFLICT,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.ITEM_UNAVAILABLE),
			HttpStatus.CONFLICT,
		);
		assert.equal(
			mapDomainErrorToHttpStatus(CART_ERROR_CODES.VALIDATION_ERROR),
			HttpStatus.UNPROCESSABLE_ENTITY,
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

		assert.equal(capturedStatus, HttpStatus.NOT_FOUND);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HttpStatus.NOT_FOUND,
			code: CART_ERROR_CODES.CART_NOT_FOUND,
			message: CART_MESSAGES.NOT_FOUND,
			error: undefined,
		});
	});

	it("should format response correctly when handling AppError (UnauthorizedError)", () => {
		const err = new UnauthorizedError();
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

		assert.equal(capturedStatus, HttpStatus.UNAUTHORIZED);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HttpStatus.UNAUTHORIZED,
			code: ORDER_ERROR_CODES.UNAUTHORIZED,
			message: messages.UNAUTHORIZED,
			error: undefined,
		});
	});

	it("should format response correctly when handling AppError (ForbiddenError)", () => {
		const err = new ForbiddenError();
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

		assert.equal(capturedStatus, HttpStatus.FORBIDDEN);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HttpStatus.FORBIDDEN,
			code: ORDER_ERROR_CODES.FORBIDDEN,
			message: messages.FORBIDDEN,
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

		assert.equal(capturedStatus, HttpStatus.INTERNAL_SERVER_ERROR);
		assert.deepEqual(capturedBody, {
			success: false,
			statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
			code: CART_ERROR_CODES.INTERNAL_SERVER_ERROR,
			message: messages.INTERNAL_SERVER_ERROR,
			error: undefined,
		});
	});
});
