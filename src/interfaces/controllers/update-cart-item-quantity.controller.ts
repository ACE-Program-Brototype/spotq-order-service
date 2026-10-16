import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/update-cart-item-quantity.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { UpdateCartItemQuantityBody } from "@interfaces/validation/update-cart-quantity.schema.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class UpdateCartItemQuantityController {
	constructor(
		@inject(TYPES.UpdateCartItemQuantityUseCase)
		private readonly updateCartItemQuantityUseCase: IUpdateCartItemQuantityUseCase,
	) {}

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
}

export default UpdateCartItemQuantityController;
