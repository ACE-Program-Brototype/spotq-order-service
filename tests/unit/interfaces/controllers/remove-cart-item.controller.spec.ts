import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	RemoveCartItemRequestDto,
	RemoveCartItemResponseDto,
} from "@application/dtos/remove-cart-item.dto.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/remove-cart-item.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { RemoveCartItemController } from "@interfaces/controllers/remove-cart-item.controller.ts";
import type { Request, Response } from "express";

class MockRemoveCartItemUseCase implements IRemoveCartItemUseCase {
	public executedDto: RemoveCartItemRequestDto | null = null;
	public shouldThrow: Error | null = null;

	public async execute(
		dto: RemoveCartItemRequestDto,
	): Promise<RemoveCartItemResponseDto> {
		this.executedDto = dto;
		if (this.shouldThrow) {
			throw this.shouldThrow;
		}
		return {
			cartId: dto.cartId,
			restaurantId: "rest-1",
			itemCount: 0,
			subtotal: 0,
			updatedAt: new Date().toISOString(),
			items: [],
		};
	}
}

describe("RemoveCartItemController", () => {
	it("should respond with 200 OK and updated cart data on successful item removal", async () => {
		const useCase = new MockRemoveCartItemUseCase();
		const controller = new RemoveCartItemController(useCase);

		const req = {
			params: {
				cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
				cartItemId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
			},
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

		await controller.removeItem(req, res);

		assert.equal(respondedStatus, HttpStatus.OK);
		assert.deepEqual(responseBody, {
			success: true,
			statusCode: HttpStatus.OK,
			message: CART_MESSAGES.ITEM_REMOVED_SUCCESS,
			data: {
				cartId: "3fa85f64-5717-4562-b3fc-2c963f66afa6",
				restaurantId: "rest-1",
				itemCount: 0,
				subtotal: 0,
				updatedAt: (responseBody as { data: { updatedAt: string } }).data
					.updatedAt,
				items: [],
			},
		});
	});

	it("should bubble domain errors to error middleware", async () => {
		const useCase = new MockRemoveCartItemUseCase();
		useCase.shouldThrow = new CartItemNotFoundError();
		const controller = new RemoveCartItemController(useCase);

		const req = {
			params: {
				cartId: "cart-1",
				cartItemId: "item-1",
			},
			user: { userId: "user-1" },
		} as unknown as Request;

		const res = {} as unknown as Response;

		await assert.rejects(
			async () => controller.removeItem(req, res),
			CartItemNotFoundError,
		);
	});
});
