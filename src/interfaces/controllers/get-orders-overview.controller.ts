import { OrdersOverviewMapper } from "@application/mappers/orders-overview.mapper.ts";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/get-orders-overview.use-case.port.ts";
import { HTTP_STATUS } from "@common/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@common/constants/message.constants.ts";
import { sendSuccessResponse } from "@common/response/api-response.ts";
import { TYPES } from "@config/di/types.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class GetOrdersOverviewController {
	constructor(
		@inject(TYPES.GetOrdersOverviewUseCase)
		private readonly getOrdersOverviewUseCase: IGetOrdersOverviewUseCase,
	) {}

	public getOrdersOverview = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const inputDto = OrdersOverviewMapper.toInputDto(req);
		const result = await this.getOrdersOverviewUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.OVERVIEW_FETCHED_SUCCESS,
			HTTP_STATUS.OK,
		);
	};
}

export default GetOrdersOverviewController;
