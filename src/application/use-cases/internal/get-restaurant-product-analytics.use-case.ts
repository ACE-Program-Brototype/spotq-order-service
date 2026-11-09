import type {
	GetRestaurantProductAnalyticsInputDto,
	RestaurantProductAnalyticsResponseDto,
} from "@application/dtos/internal/restaurant-product-analytics.dto.ts";
import type { IGetRestaurantProductAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-product-analytics.use-case.port.ts";
import { resolveAnalyticsDateRange } from "@application/utils/date-range.util.ts";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetRestaurantProductAnalyticsUseCase
	implements IGetRestaurantProductAnalyticsUseCase
{
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		input: GetRestaurantProductAnalyticsInputDto,
	): Promise<RestaurantProductAnalyticsResponseDto> {
		const range = resolveAnalyticsDateRange({
			interval: input.interval,
			day: input.day,
			month: input.month,
			year: input.year,
			timezone: input.timezone,
		});

		const page = input.page && input.page > 0 ? input.page : 1;
		const limit =
			input.limit && input.limit > 0 ? Math.min(input.limit, 50) : 10;

		if (!this.orderRepository.getRestaurantProductAnalytics) {
			throw new Error("Order repository does not support product analytics");
		}

		const result = await this.orderRepository.getRestaurantProductAnalytics({
			restaurantId: input.restaurantId,
			startDate: range.startDate,
			nextPeriodStart: range.nextPeriodStart,
			page,
			limit,
		});

		return {
			restaurantId: input.restaurantId,
			timezone: range.timezone,
			totalProductsSold: result.totalProductsSold,
			topSelling: result.topSelling,
			slowMoving: result.slowMoving,
			filters: {
				interval: range.interval,
				day: range.day,
				month: range.month,
				year: range.year,
				page,
				limit,
			},
			generatedAt: new Date().toISOString(),
		};
	}
}
