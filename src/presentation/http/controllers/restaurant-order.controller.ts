import type { GetOrdersOverviewInputDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetRestaurantOrderDetailsInputDTO } from "@application/dtos/orders/get-restaurant-order-details.dto";
import type { GetRestaurantOrdersListInputDTO } from "@application/dtos/orders/get-restaurant-orders.dto";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port.ts";
import type { IGetRestaurantOrdersDetailsUseCase } from "@application/ports/use-cases/orders/get-restaurant-order-details.use-case.port";
import type { IGetRestaurantOrdersListUseCase } from "@application/ports/use-cases/orders/get-restaurant-orders.use-case.port";
import { TYPES } from "@config/di/types.ts";
import type { OrdersOverviewQuery } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
import type { RestaurantOrderListQuery } from "@presentation/http/validators/orders/restaurant-orders-list-query.schema";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { sendSuccessResponse } from "@shared/response/api-response.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class RestaurantOrderController {
	constructor(
		@inject(TYPES.GetOrdersOverviewUseCase)
		private readonly getOrdersOverviewUseCase: IGetOrdersOverviewUseCase,

		@inject(TYPES.GetRestaurantOrdersListUseCase)
		private readonly getRestaurantOrderListUseCase: IGetRestaurantOrdersListUseCase,

		@inject(TYPES.GetRestaurantOrderDetailsUseCase)
		private readonly getRestaurantOrderDetailsUseCase: IGetRestaurantOrdersDetailsUseCase,
	) {}

	public getOrdersOverview = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const query = req.query as unknown as OrdersOverviewQuery;
		const inputDto: GetOrdersOverviewInputDTO = {
			restaurantId: req.params.restaurantId as string,
			from: query?.from,
			to: query?.to,
		};
		const result = await this.getOrdersOverviewUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.OVERVIEW_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public getRestaurantOrderList = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const query = req.query as unknown as RestaurantOrderListQuery;
		const inputDto: GetRestaurantOrdersListInputDTO = {
			restaurantId: req.params.restaurantId as string,
			...query,
		};
		const result = await this.getRestaurantOrderListUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_LIST_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public getRestaurantOrderDetails = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const inputDto: GetRestaurantOrderDetailsInputDTO = {
			restaurantId: req.params.restaurantId as string,
			orderId: req.params.orderId as string,
		};
		const result =
			await this.getRestaurantOrderDetailsUseCase.execute(inputDto);

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_DETAILS_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};
}

export default RestaurantOrderController;