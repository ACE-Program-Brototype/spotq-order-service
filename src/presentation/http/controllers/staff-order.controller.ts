import type { IUpdateOrderStatusUseCase } from "@application/ports/use-cases/orders/update-order-status.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import { StaffOrderRequestMapper } from "@presentation/http/mappers/staff-order-request.mapper.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { sendSuccessResponse } from "@shared/response/api-response.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class StaffOrderController {
	constructor(
		@inject(TYPES.UpdateOrderStatusUseCase)
		private readonly updateOrderStatusUseCase: IUpdateOrderStatusUseCase,
	) {}

	public updateOrderStatus = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const inputDto = StaffOrderRequestMapper.toUpdateOrderStatusInputDto(req);
		const result = await this.updateOrderStatusUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_STATUS_UPDATED_SUCCESS,
			HttpStatus.OK,
		);
	};
}
