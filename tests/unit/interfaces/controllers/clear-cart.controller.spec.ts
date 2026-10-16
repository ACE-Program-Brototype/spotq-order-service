import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	ClearCartRequestDto,
	ClearCartResponseDto,
} from "@application/dtos/clear-cart.dto.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/clear-cart.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { CartNotFoundError } from "@domain/errors/cart-not-found.error.ts";
import { ClearCartController } from "@interfaces/controllers/clear-cart.controller.ts";
import type { Request, Response } from "express";

class MockClearCartUseCase implements IClearCartUseCase {
	public executedDto: ClearCartRequestDto | null = null;
	public shouldThrow: Error | null = null;

	public async execute(
		dto: ClearCartRequestDto,
	): Promise<ClearCartResponseDto> {
		this.executedDto = dto;
		if (this.shouldThrow) {
			throw this.shouldThrow;
		}
		return {
			cartId: dto.cartId,
			restaurantId: null,
			itemCount: 0,
			subtotal: 0,
			updatedAt: new Date().toISOString(),
			items: [],
		};
	}
}

describe("ClearCartController", () => {
	it("should respond with 200 OK and cleared cart data on success", async () => {
		const useCase = new MockClearCartUseCase();
		const controller = new ClearCartController(useCase);

		const req = {
			params: { cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6" },
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

		await controller.clearCart(req, res);

		assert.equal(respondedStatus, HttpStatus.OK);
		assert.deepEqual(responseBody, {
			success: true,
			statusCode: HttpStatus.OK,
			message: CART_MESSAGES.CART_CLEARED_SUCCESS,
			data: {
				cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
				restaurantId: null,
				itemCount: 0,
				subtotal: 0,
				updatedAt: (responseBody as { data: { updatedAt: string } }).data
					.updatedAt,
				items: [],
			},
		});
	});

	it("should bubble domain errors to error middleware", async () => {
		const useCase = new MockClearCartUseCase();
		useCase.shouldThrow = new CartNotFoundError();
		const controller = new ClearCartController(useCase);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
		} as unknown as Request;

		const res = {} as unknown as Response;

		await assert.rejects(
			async () => controller.clearCart(req, res),
			CartNotFoundError,
		);
	});
});
