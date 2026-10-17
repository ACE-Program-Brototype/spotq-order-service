import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import { RestaurantOrderRequestMapper } from "@interfaces/mappers/restaurant-order-request.mapper.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class RestaurantOrderController {
	constructor(
		@inject(TYPES.GetOrdersOverviewUseCase)
		private readonly getOrdersOverviewUseCase: IGetOrdersOverviewUseCase,
	) {}

	public getOrdersOverview = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const inputDto = RestaurantOrderRequestMapper.toOrdersOverviewInputDto(req);
		const result = await this.getOrdersOverviewUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.OVERVIEW_FETCHED_SUCCESS,
			HTTP_STATUS.OK,
		);
	};
}

export default RestaurantOrderController;
