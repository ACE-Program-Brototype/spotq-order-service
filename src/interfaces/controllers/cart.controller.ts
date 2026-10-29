import type { IAddBatchCartItemsUseCase } from "@application/ports/use-cases/cart/add-batch-cart-items.use-case.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { AddBatchCartItemsBody } from "@interfaces/validation/cart/add-batch-cart-items.schema.ts";
import type { AddCartItemBody } from "@interfaces/validation/cart/add-cart-item.schema.ts";
import type { UpdateCartItemQuantityBody } from "@interfaces/validation/cart/update-cart-quantity.schema.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class CartController {
	constructor(
		@inject(TYPES.GetCartUseCase)
		private readonly getCartUseCase: IGetCartUseCase,
		@inject(TYPES.AddCartItemUseCase)
		private readonly addCartItemUseCase: IAddCartItemUseCase,
		@inject(TYPES.AddBatchCartItemsUseCase)
		private readonly addBatchCartItemsUseCase: IAddBatchCartItemsUseCase,
		@inject(TYPES.UpdateCartItemQuantityUseCase)
		private readonly updateCartItemQuantityUseCase: IUpdateCartItemQuantityUseCase,
		@inject(TYPES.RemoveCartItemUseCase)
		private readonly removeCartItemUseCase: IRemoveCartItemUseCase,
		@inject(TYPES.ClearCartUseCase)
		private readonly clearCartUseCase: IClearCartUseCase,
	) {}

	public getCart = async (req: Request, res: Response): Promise<void> => {
		const cartId = req.params.cartId as string;
		const authenticatedUserId = req.user?.userId as string;

		const cart = await this.getCartUseCase.execute({
			cartId,
			authenticatedUserId,
		});

		sendSuccessResponse(
			res,
			cart,
			CART_MESSAGES.FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public addItem = async (req: Request, res: Response): Promise<void> => {
		const cartId = (req.params.cartId ?? req.body?.cartId) as
			| string
			| undefined;
		const authenticatedUserId = req.user?.userId as string;
		const body = req.body as AddCartItemBody;

		const result = await this.addCartItemUseCase.execute({
			cartId,
			authenticatedUserId,
			restaurantId: body.restaurantId,
			menuItemId: body.menuItemId,
			variantId: body.variantId,
			addonIds: body.addonIds,
			quantity: body.quantity,
			specialInstructions: body.specialInstructions,
		});

		sendSuccessResponse(
			res,
			result,
			CART_MESSAGES.ITEM_ADDED_SUCCESS,
			HttpStatus.CREATED,
		);
	};

	public addItemsBatch = async (req: Request, res: Response): Promise<void> => {
		const authenticatedUserId = req.user?.userId as string;
		const body = req.body as AddBatchCartItemsBody;

		const result = await this.addBatchCartItemsUseCase.execute({
			authenticatedUserId,
			restaurantId: body.restaurantId,
			items: body.items,
		});

		sendSuccessResponse(
			res,
			result,
			CART_MESSAGES.ITEMS_BATCH_ADDED_SUCCESS,
			HttpStatus.CREATED,
		);
	};

	public updateQuantity = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const cartId = req.params.cartId as string;
		const cartItemId = req.params.cartItemId as string;
		const authenticatedUserId = req.user?.userId as string;
		const body = req.body as UpdateCartItemQuantityBody;

		const result = await this.updateCartItemQuantityUseCase.execute({
			cartId,
			cartItemId,
			quantity: body.quantity,
			authenticatedUserId,
		});

		sendSuccessResponse(
			res,
			result,
			CART_MESSAGES.ITEM_UPDATED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public removeItem = async (req: Request, res: Response): Promise<void> => {
		const cartId = req.params.cartId as string;
		const cartItemId = req.params.cartItemId as string;
		const authenticatedUserId = req.user?.userId as string;

		const result = await this.removeCartItemUseCase.execute({
			cartId,
			cartItemId,
			authenticatedUserId,
		});

		sendSuccessResponse(
			res,
			result,
			CART_MESSAGES.ITEM_REMOVED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public clearCart = async (req: Request, res: Response): Promise<void> => {
		const cartId = req.params.cartId as string;
		const authenticatedUserId = req.user?.userId as string;

		const result = await this.clearCartUseCase.execute({
			cartId,
			authenticatedUserId,
		});

		sendSuccessResponse(
			res,
			result,
			CART_MESSAGES.CART_CLEARED_SUCCESS,
			HttpStatus.OK,
		);
	};
}
