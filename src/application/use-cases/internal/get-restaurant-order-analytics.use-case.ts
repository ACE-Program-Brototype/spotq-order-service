import type {
	GetRestaurantOrderAnalyticsInputDto,
	RestaurantOrderAnalyticsSummaryResponseDto,
} from "@application/dtos/internal/restaurant-order-analytics.dto.ts";
import type { IGetRestaurantOrderAnalyticsUseCase } from "@application/ports/use-cases/internal/get-restaurant-order-analytics.use-case.port.ts";
import { resolveAnalyticsDateRange } from "@application/utils/date-range.util.ts";
import { TYPES } from "@config/di/types.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import { inject, injectable } from "inversify";

@injectable()
export class GetRestaurantOrderAnalyticsUseCase
	implements IGetRestaurantOrderAnalyticsUseCase
{
	constructor(
		@inject(TYPES.OrderRepository)
		private readonly orderRepository: IOrderRepository,
	) {}

	public async execute(
		input: GetRestaurantOrderAnalyticsInputDto,
	): Promise<RestaurantOrderAnalyticsSummaryResponseDto> {
		const range = resolveAnalyticsDateRange({
			interval: input.interval,
			day: input.day,
			month: input.month,
			year: input.year,
			timezone: input.timezone,
		});

		if (!this.orderRepository.getRestaurantOrderAnalytics) {
			throw new Error("Order repository does not support analytics");
		}

		const result = await this.orderRepository.getRestaurantOrderAnalytics({
			restaurantId: input.restaurantId,
			startDate: range.startDate,
			nextPeriodStart: range.nextPeriodStart,
			prevStartDate: range.prevStartDate,
			status: input.status,
		});

		return {
			restaurantId: input.restaurantId,
			timezone: range.timezone,
			overview: result.overview,
			orderStatusBreakdown: result.orderStatusBreakdown,
			filters: {
				interval: range.interval,
				day: range.day,
				month: range.month,
				year: range.year,
				status: input.status ?? "COMPLETED",
				timezone: range.timezone,
			},
			generatedAt: new Date().toISOString(),
		};
	}
}
