import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { PlaceOrderBody } from "@interfaces/validation/order/place-order.schema.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class OrderController {
	constructor(
		@inject(TYPES.PlaceOrderUseCase)
		private readonly placeOrderUseCase: IPlaceOrderUseCase,
	) {}

	public placeOrder = async (req: Request, res: Response): Promise<void> => {
		const userId = req.user?.userId as string;
		const body = req.body as PlaceOrderBody;

		const result = await this.placeOrderUseCase.execute({
			userId,
			userName: body.userName ?? req.user?.name,
			userPhone: body.userPhone ?? req.user?.phone,
			restaurantId: body.restaurantId,
			cartId: body.cartId,
			paymentMode: body.paymentMode,
			specialInstructions: body.specialInstructions ?? undefined,
		});

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_PLACED_SUCCESS,
			HTTP_STATUS.CREATED,
		);
	};
}

export default OrderController;
