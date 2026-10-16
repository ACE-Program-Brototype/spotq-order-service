import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type {
	AddCartItemRequestDto,
	AddCartItemResponseDto,
} from "@application/dtos/add-cart-item.dto.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { DifferentRestaurantCartError } from "@domain/errors/different-restaurant-cart.error.ts";
import { AddCartItemController } from "@interfaces/controllers/add-cart-item.controller.ts";
import type { Request, Response } from "express";

class MockAddCartItemUseCase implements IAddCartItemUseCase {
	public executedDto: AddCartItemRequestDto | null = null;
	public shouldThrow: Error | null = null;

	public async execute(
		dto: AddCartItemRequestDto,
	): Promise<AddCartItemResponseDto> {
		this.executedDto = dto;
		if (this.shouldThrow) {
			throw this.shouldThrow;
		}
		return {
			cartId: dto.cartId,
			restaurantId: dto.restaurantId,
			itemCount: dto.quantity,
			subtotal: 538,
			updatedAt: new Date().toISOString(),
			items: [
				{
					id: "item-1",
					menuItemId: dto.menuItemId,
					quantity: dto.quantity,
					unitPrice: 249,
					totalPrice: 538,
				},
			],
		};
	}
}

describe("AddCartItemController", () => {
	it("should respond with 201 Created and cart data on success", async () => {
		const useCase = new MockAddCartItemUseCase();
		const controller = new AddCartItemController(useCase);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
			body: {
				restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
				menuItemId: "3f2a1b00-55de-4d39-a9a7-9f6b986e8123",
				quantity: 2,
			},
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

		await controller.addItem(req, res);

		assert.equal(respondedStatus, HttpStatus.CREATED);
		assert.deepEqual(responseBody, {
			success: true,
			statusCode: HttpStatus.CREATED,
			message: CART_MESSAGES.ITEM_ADDED_SUCCESS,
			data: {
				cartId: "cart-1",
				restaurantId: "2b6f0cc9-8d13-4f2e-a123-9e8ab12cd345",
				itemCount: 2,
				subtotal: 538,
				updatedAt: (responseBody as { data: { updatedAt: string } }).data
					.updatedAt,
				items: [
					{
						id: "item-1",
						menuItemId: "3f2a1b00-55de-4d39-a9a7-9f6b986e8123",
						quantity: 2,
						unitPrice: 249,
						totalPrice: 538,
					},
				],
			},
		});
	});

	it("should bubble domain errors to error middleware", async () => {
		const useCase = new MockAddCartItemUseCase();
		useCase.shouldThrow = new DifferentRestaurantCartError();
		const controller = new AddCartItemController(useCase);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
			body: {
				restaurantId: "diff-restaurant",
				menuItemId: "item-1",
				quantity: 1,
			},
		} as unknown as Request;

		const res = {} as unknown as Response;

		await assert.rejects(
			async () => controller.addItem(req, res),
			DifferentRestaurantCartError,
		);
	});
});
