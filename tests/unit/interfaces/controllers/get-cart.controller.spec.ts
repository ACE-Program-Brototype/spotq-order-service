import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	GetCartRequestDto,
	GetCartResponseDto,
} from "@application/dtos/get-cart.dto.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import type { NextFunction, Request, Response } from "express";

class MockGetCartUseCase implements IGetCartUseCase {
	public executedDto: GetCartRequestDto | null = null;
	public shouldThrow: Error | null = null;

	public async execute(dto: GetCartRequestDto): Promise<GetCartResponseDto> {
		this.executedDto = dto;
		if (this.shouldThrow) {
			throw this.shouldThrow;
		}
		return {
			cartId: dto.cartId,
			restaurantId: "rest-1",
			userId: dto.authenticatedUserId,
			status: "ACTIVE",
			itemCount: 1,
			subtotal: 200,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			expiresAt: new Date().toISOString(),
			items: [],
		};
	}
}

describe("GetCartController", () => {
	it("should respond with 200 OK and cart data on success", async () => {
		const useCase = new MockGetCartUseCase();
		const controller = new GetCartController(useCase);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
		} as unknown as Request;

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

		let nextCalled = false;
		const next: NextFunction = () => {
			nextCalled = true;
		};

		await controller.handle(req, res, next);

		assert.equal(nextCalled, false);
		assert.equal(respondedStatus, HttpStatus.OK);
		assert.deepEqual(responseBody, {
			success: true,
			statusCode: HttpStatus.OK,
			message: CART_MESSAGES.FETCHED_SUCCESS,
			data: {
				cartId: "cart-1",
				restaurantId: "rest-1",
				userId: "user-1",
				status: "ACTIVE",
				itemCount: 1,
				subtotal: 200,
				createdAt: (responseBody as { data: { createdAt: string } }).data
					.createdAt,
				updatedAt: (responseBody as { data: { updatedAt: string } }).data
					.updatedAt,
				expiresAt: (responseBody as { data: { expiresAt: string } }).data
					.expiresAt,
				items: [],
			},
		});
	});

	it("should forward domain errors to next middleware", async () => {
		const useCase = new MockGetCartUseCase();
		useCase.shouldThrow = new CartNotFoundError();
		const controller = new GetCartController(useCase);

		const req = {
			params: { cartId: "missing-cart" },
			user: { userId: "user-1" },
		} as unknown as Request;

		const res = {} as unknown as Response;

		let passedError: unknown = null;
		const next: NextFunction = (err?: unknown) => {
			passedError = err;
		};

		await controller.handle(req, res, next);

		assert.ok(passedError instanceof CartNotFoundError);
	});
});
