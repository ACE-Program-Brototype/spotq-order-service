import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderRequestMapper } from "@presentation/http/mappers/order-request.mapper.ts";
import type { PlaceOrderBody } from "@presentation/http/validators/orders/place-order.schema.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { sendSuccessResponse } from "@shared/response/api-response.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class CustomerOrderController {
	constructor(
		@inject(TYPES.PlaceOrderUseCase)
		private readonly placeOrderUseCase: IPlaceOrderUseCase,
		@inject(TYPES.GetOrderHistoryUseCase)
		private readonly getOrderHistoryUseCase: IGetOrderHistoryUseCase,
		@inject(TYPES.CancelOrderUseCase)
		private readonly cancelOrderUseCase: ICancelOrderUseCase,
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
			HttpStatus.CREATED,
		);
	};

	public getOrderHistory = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const inputDto = OrderRequestMapper.toOrderHistoryInputDto(req);
		const result = await this.getOrderHistoryUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.HISTORY_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public cancelOrder = async (req: Request, res: Response): Promise<void> => {
		const inputDto = OrderRequestMapper.toCancelOrderInputDto(req);
		const result = await this.cancelOrderUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.CANCEL_SUCCESS,
			HttpStatus.OK,
		);
	};
}

export default CustomerOrderController;
