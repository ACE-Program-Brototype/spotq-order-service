import type { IClearCartUseCase } from "@application/ports/use-cases/clear-cart.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class ClearCartController {
	constructor(
		@inject(TYPES.ClearCartUseCase)
		private readonly clearCartUseCase: IClearCartUseCase,
	) {}

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

export default ClearCartController;
