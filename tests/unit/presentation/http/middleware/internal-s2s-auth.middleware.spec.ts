import assert from "node:assert/strict";
import crypto from "node:crypto";
import { describe, it } from "node:test";
import env from "@config/env.ts";
import {
	internalS2SAuthMiddleware,
	requireCallerService,
} from "@presentation/http/middleware/internal-s2s-auth.middleware.ts";
import { S2S_CALLER_SERVICES } from "@shared/constants/auth.constants.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { generateToken, type TokenIssuerConfig } from "@spotq-org/s2s-core";
import type { Request, Response } from "express";

describe("Internal S2S Auth Middleware", () => {
	const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
		modulusLength: 2048,
		publicKeyEncoding: { type: "spki", format: "pem" },
		privateKeyEncoding: { type: "pkcs8", format: "pem" },
	});

	// Configure mock environment keys
	const originalKey = env.RESTAURANT_S2S_PUBLIC_KEY;
	const originalAud = env.S2S_AUDIENCE;

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

	it("should reject request when Authorization header is missing (401)", () => {
		const middleware = internalS2SAuthMiddleware();
		const req = {
			headers: {
				"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			},
		} as unknown as Request;
		const { res, getStatus } = createMockResponse();
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(getStatus(), HttpStatus.UNAUTHORIZED);
	});

	it("should reject request when x-caller-service header is missing (401)", () => {
		const middleware = internalS2SAuthMiddleware();
		const req = {
			headers: {
				authorization: "Bearer some-token",
			},
		} as unknown as Request;
		const { res, getStatus } = createMockResponse();
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.strictEqual(nextCalled, false);
		assert.strictEqual(getStatus(), HttpStatus.UNAUTHORIZED);
	});

	it("should authenticate valid S2S token and populate req.callerService", () => {
		(env as { RESTAURANT_S2S_PUBLIC_KEY: string }).RESTAURANT_S2S_PUBLIC_KEY =
			publicKey;
		(env as { S2S_AUDIENCE: string }).S2S_AUDIENCE = "order-service";

		const issuerConfig: TokenIssuerConfig = {
			serviceName: S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			privateKey,
		};
		const token = generateToken("order-service", issuerConfig);

		const middleware = internalS2SAuthMiddleware();
		const req = {
			headers: {
				authorization: `Bearer ${token}`,
				"x-caller-service": S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			},
		} as unknown as Request;
		const { res } = createMockResponse();
		let nextCalled = false;

		middleware(req, res, () => {
			nextCalled = true;
		});

		assert.strictEqual(nextCalled, true);
		assert.strictEqual(
			req.callerService,
			S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
		);

		// Restore
		(env as { RESTAURANT_S2S_PUBLIC_KEY: string }).RESTAURANT_S2S_PUBLIC_KEY =
			originalKey;
		(env as { S2S_AUDIENCE: string }).S2S_AUDIENCE = originalAud;
	});

	describe("requireCallerService", () => {
		it("should proceed when callerService matches allowed services", () => {
			const guard = requireCallerService([
				S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			]);
			const req = {
				callerService: S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			} as unknown as Request;
			const { res } = createMockResponse();
			let nextCalled = false;

			guard(req, res, () => {
				nextCalled = true;
			});

			assert.strictEqual(nextCalled, true);
		});

		it("should reject with 403 Forbidden when callerService is not allowed", () => {
			const guard = requireCallerService([
				S2S_CALLER_SERVICES.RESTAURANT_SERVICE,
			]);
			const req = {
				callerService: "unauthorized-service",
			} as unknown as Request;
			const { res, getStatus, getBody } = createMockResponse();
			let nextCalled = false;

			guard(req, res, () => {
				nextCalled = true;
			});

			assert.strictEqual(nextCalled, false);
			assert.strictEqual(getStatus(), HttpStatus.FORBIDDEN);
			assert.deepStrictEqual((getBody() as { code: string }).code, "FORBIDDEN");
		});
	});
});
