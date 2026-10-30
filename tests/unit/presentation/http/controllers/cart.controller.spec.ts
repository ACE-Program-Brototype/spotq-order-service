import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { IAddBatchCartItemsUseCase } from "@application/ports/use-cases/cart/add-batch-cart-items.use-case.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import { CartNotFoundError } from "@domain/errors/cart.errors.ts";
import { CartController } from "@presentation/http/controllers/cart.controller.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { CART_MESSAGES } from "@shared/constants/message.constants.ts";
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

describe("CartController", () => {
	const mockGetCartUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: "ACTIVE",
			itemCount: 1,
			subtotal: 100,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			expiresAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IGetCartUseCase;

	const mockAddCartItemUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: "rest-1",
			itemCount: 2,
			subtotal: 200,
			updatedAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IAddCartItemUseCase;

	const mockAddBatchCartItemsUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: "rest-1",
			userId: "user-1",
			status: "ACTIVE",
			itemCount: 3,
			subtotal: 850,
			createdAt: new Date().toISOString(),
			updatedAt: new Date().toISOString(),
			expiresAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IAddBatchCartItemsUseCase;

	const mockUpdateCartItemQuantityUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: "rest-1",
			itemCount: 3,
			subtotal: 300,
			updatedAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IUpdateCartItemQuantityUseCase;

	const mockRemoveCartItemUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: "rest-1",
			itemCount: 0,
			subtotal: 0,
			updatedAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IRemoveCartItemUseCase;

	const mockClearCartUseCase = {
		execute: async () => ({
			cartId: "cart-1",
			restaurantId: null,
			itemCount: 0,
			subtotal: 0,
			updatedAt: new Date().toISOString(),
			items: [],
		}),
	} as unknown as IClearCartUseCase;

	it("should get cart successfully", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.getCart(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.FETCHED_SUCCESS,
		);
	});

	it("should add cart item successfully with 201 Created", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
			body: {
				restaurantId: "rest-1",
				menuItemId: "item-1",
				quantity: 2,
			},
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.addItem(req, res);

		assert.equal(getStatus(), HttpStatus.CREATED);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.ITEM_ADDED_SUCCESS,
		);
	});

	it("should add batch cart items successfully with 201 Created", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			user: { userId: "user-1" },
			body: {
				restaurantId: "rest-1",
				items: [
					{
						menuItemId: "item-1",
						quantity: 2,
					},
				],
			},
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.addItemsBatch(req, res);

		assert.equal(getStatus(), HttpStatus.CREATED);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.ITEMS_BATCH_ADDED_SUCCESS,
		);
	});

	it("should update quantity successfully", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-1", cartItemId: "item-1" },
			user: { userId: "user-1" },
			body: { quantity: 3 },
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.updateQuantity(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.ITEM_UPDATED_SUCCESS,
		);
	});

	it("should remove item successfully", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-1", cartItemId: "item-1" },
			user: { userId: "user-1" },
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.removeItem(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.ITEM_REMOVED_SUCCESS,
		);
	});

	it("should clear cart successfully", async () => {
		const controller = new CartController(
			mockGetCartUseCase,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-1" },
			user: { userId: "user-1" },
		} as unknown as Request;
		const { res, getStatus, getBody } = createMockResponse();

		await controller.clearCart(req, res);

		assert.equal(getStatus(), HttpStatus.OK);
		assert.equal(
			(getBody() as { message: string }).message,
			CART_MESSAGES.CART_CLEARED_SUCCESS,
		);
	});

	it("should bubble domain errors to error middleware", async () => {
		const failingGetCart = {
			execute: async () => {
				throw new CartNotFoundError();
			},
		} as unknown as IGetCartUseCase;

		const controller = new CartController(
			failingGetCart,
			mockAddCartItemUseCase,
			mockAddBatchCartItemsUseCase,
			mockUpdateCartItemQuantityUseCase,
			mockRemoveCartItemUseCase,
			mockClearCartUseCase,
		);

		const req = {
			params: { cartId: "cart-not-found" },
			user: { userId: "user-1" },
		} as unknown as Request;
		const res = {} as unknown as Response;

		await assert.rejects(
			async () => controller.getCart(req, res),
			CartNotFoundError,
		);
	});
});
