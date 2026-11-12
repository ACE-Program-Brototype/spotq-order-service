import type { IGetAdminOrdersUseCase } from "@application/ports/use-cases/orders/get-admin-orders.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import type { AdminOrdersListQuery } from "@presentation/http/validators/orders/admin-orders-list-query.schema.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { sendSuccessResponse } from "@shared/response/api-response.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class AdminOrderController {
	constructor(
		@inject(TYPES.GetAdminOrdersUseCase)
		private readonly getAdminOrdersUseCase: IGetAdminOrdersUseCase,
	) {}

	getAdminOrders = async (req: Request, res: Response): Promise<void> => {
		const query = req.query as unknown as AdminOrdersListQuery;
		const result = await this.getAdminOrdersUseCase.execute(query);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_LIST_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};
}
