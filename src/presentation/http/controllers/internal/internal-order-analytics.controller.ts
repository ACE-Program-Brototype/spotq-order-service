import type { IGetRestaurantOrderAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-order-analytics.use-case.port.ts";
import type { IGetRestaurantProductAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-product-analytics.use-case.port.ts";
import { TYPES } from "@config/di/types.ts";
import type { IInternalOrderAnalyticsController } from "@presentation/http/controllers/internal/internal-order-analytics.controller.interface.ts";
import type {
	OrderAnalyticsSummaryQuery,
	OrderProductAnalyticsQuery,
} from "@presentation/http/validators/internal/order-analytics.validator.ts";
import { HttpStatus } from "@shared/constants/http.constants.ts";
import { ORDER_MESSAGES } from "@shared/constants/message.constants.ts";
import { sendSuccessResponse } from "@shared/responses/api-response.ts";
import type { Request, Response } from "express";
import { inject, injectable } from "inversify";

@injectable()
export class InternalOrderAnalyticsController
	implements IInternalOrderAnalyticsController
{
	constructor(
		@inject(TYPES.GetRestaurantOrderAnalyticsUseCase)
		private readonly getRestaurantOrderAnalyticsUseCase: IGetRestaurantOrderAnalyticsUseCase,
		@inject(TYPES.GetRestaurantProductAnalyticsUseCase)
		private readonly getRestaurantProductAnalyticsUseCase: IGetRestaurantProductAnalyticsUseCase,
	) {}

	public getRestaurantOrderSummary = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const { restaurantId } = req.params as { restaurantId: string };
		const query = req.query as unknown as OrderAnalyticsSummaryQuery;

		const result = await this.getRestaurantOrderAnalyticsUseCase.execute({
			restaurantId,
			interval: query.interval,
			day: query.day,
			month: query.month,
			year: query.year,
			timezone: query.timezone,
		});

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.ORDER_ANALYTICS_SUMMARY_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};

	public getRestaurantProductAnalytics = async (
		req: Request,
		res: Response,
	): Promise<void> => {
		const { restaurantId } = req.params as { restaurantId: string };
		const query = req.query as unknown as OrderProductAnalyticsQuery;

		const result = await this.getRestaurantProductAnalyticsUseCase.execute({
			restaurantId,
			interval: query.interval,
			day: query.day,
			month: query.month,
			year: query.year,
			timezone: query.timezone,
			page: query.page,
			limit: query.limit,
		});

		sendSuccessResponse(
			res,
			result,
			ORDER_MESSAGES.PRODUCT_ANALYTICS_FETCHED_SUCCESS,
			HttpStatus.OK,
		);
	};
}
