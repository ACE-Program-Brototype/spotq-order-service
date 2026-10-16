import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/remove-cart-item.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class RemoveCartItemController {
	constructor(
		@inject(TYPES.RemoveCartItemUseCase)
		private readonly removeCartItemUseCase: IRemoveCartItemUseCase,
	) {}

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
}

export default RemoveCartItemController;
