import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { AddCartItemBody } from "@interfaces/validation/add-cart-item.schema.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class AddCartItemController {
	constructor(
		@inject(TYPES.AddCartItemUseCase)
		private readonly addCartItemUseCase: IAddCartItemUseCase,
	) {}

	public addItem = async (req: Request, res: Response): Promise<void> => {
		const cartId = req.params.cartId as string;
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
}

export default AddCartItemController;
