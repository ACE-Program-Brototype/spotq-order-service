import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import { HttpStatus } from "@common/constants/http.constants.ts";
import { CART_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class GetCartController {
	constructor(
		@inject(TYPES.GetCartUseCase)
		private readonly getCartUseCase: IGetCartUseCase,
	) {}

	public async handle(
		req: Request,
		res: Response,
		next: NextFunction,
	): Promise<void> {
		try {
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
		} catch (error) {
			next(error);
		}
	}
}

export default GetCartController;
