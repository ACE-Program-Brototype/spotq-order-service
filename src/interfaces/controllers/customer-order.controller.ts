import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import type { IGetCheckoutDetailsUseCase } from "@application/ports/use-cases/orders/get-checkout-details.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import { OrderRequestMapper } from "@interfaces/mappers/order-request.mapper.ts";
import type { CheckoutQuery } from "@interfaces/validation/orders/checkout-query.schema.ts";
import type { PlaceOrderBody } from "@interfaces/validation/orders/place-order.schema.ts";
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
		@inject(TYPES.GetCheckoutDetailsUseCase)
		private readonly getCheckoutDetailsUseCase: IGetCheckoutDetailsUseCase,
	) {}

	public getCheckoutDetails = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const userId = req.user?.userId as string;
		const query = req.query as CheckoutQuery;

		const result = await this.getCheckoutDetailsUseCase.execute({
			userId,
			restaurantId: query.restaurantId,
			cartId: query.cartId,
		});

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.CHECKOUT_DETAILS_FETCHED_SUCCESS,
			HTTP_STATUS.OK,
		);
	};

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
			HTTP_STATUS.OK,
		);
	};

	public cancelOrder = async (req: Request, res: Response): Promise<void> => {
		const inputDto = OrderRequestMapper.toCancelOrderInputDto(req);
		const result = await this.cancelOrderUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.CANCEL_SUCCESS,
			HTTP_STATUS.OK,
		);
	};
}

export default CustomerOrderController;
