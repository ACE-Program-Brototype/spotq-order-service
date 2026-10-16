import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	UpdateCartItemQuantityRequestDto,
	UpdateCartItemQuantityResponseDto,
} from "@application/dtos/update-cart-item-quantity.dto.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/update-cart-item-quantity.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { CartItemNotFoundError } from "@domain/errors/cart-item-not-found.error.ts";
import { UpdateCartItemQuantityController } from "@interfaces/controllers/update-cart-item-quantity.controller.ts";
import type { Request, Response } from "express";

class MockUpdateCartItemQuantityUseCase
	implements IUpdateCartItemQuantityUseCase
{
	public executedDto: UpdateCartItemQuantityRequestDto | null = null;
	public shouldThrow: Error | null = null;

	public async execute(
		dto: UpdateCartItemQuantityRequestDto,
	): Promise<UpdateCartItemQuantityResponseDto> {
		this.executedDto = dto;
		if (this.shouldThrow) {
			throw this.shouldThrow;
		}
		return {
			cartId: dto.cartId,
			restaurantId: "rest-1",
			itemCount: dto.quantity,
			subtotal: dto.quantity * 100,
			updatedAt: new Date().toISOString(),
			items:
				dto.quantity > 0
					? [
							{
								cartItemId: dto.cartItemId,
								menuItemId: "menu-1",
								quantity: dto.quantity,
								unitPrice: 100,
								totalPrice: dto.quantity * 100,
							},
						]
					: [],
		};
	}
}

describe("UpdateCartItemQuantityController", () => {
	it("should respond with 200 OK and updated cart data on success", async () => {
		const useCase = new MockUpdateCartItemQuantityUseCase();
		const controller = new UpdateCartItemQuantityController(useCase);

		const req = {
			params: { cartId: "cart-1", cartItemId: "item-1" },
			user: { userId: "user-1" },
			body: { quantity: 3 },
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

		await controller.updateQuantity(req, res);

		assert.equal(respondedStatus, HttpStatus.OK);
		assert.deepEqual(responseBody, {
			success: true,
			statusCode: HttpStatus.OK,
			message: CART_MESSAGES.ITEM_UPDATED_SUCCESS,
			data: {
				cartId: "cart-1",
				restaurantId: "rest-1",
				itemCount: 3,
				subtotal: 300,
				updatedAt: (responseBody as { data: { updatedAt: string } }).data
					.updatedAt,
				items: [
					{
						cartItemId: "item-1",
						menuItemId: "menu-1",
						quantity: 3,
						unitPrice: 100,
						totalPrice: 300,
					},
				],
			},
		});
	});

	it("should bubble domain errors to error middleware", async () => {
		const useCase = new MockUpdateCartItemQuantityUseCase();
		useCase.shouldThrow = new CartItemNotFoundError();
		const controller = new UpdateCartItemQuantityController(useCase);

		const req = {
			params: { cartId: "cart-1", cartItemId: "item-1" },
			user: { userId: "user-1" },
			body: { quantity: 1 },
		} as unknown as Request;

		const res = {} as unknown as Response;

		await assert.rejects(
			async () => controller.updateQuantity(req, res),
			CartItemNotFoundError,
		);
	});
});
