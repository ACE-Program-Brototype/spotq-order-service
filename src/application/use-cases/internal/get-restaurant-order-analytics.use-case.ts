import type {
	GetRestaurantOrderAnalyticsInputDTO,
	RestaurantOrderAnalyticsSummaryResponseDTO,
} from "@application/dtos/internal/restaurant-order-analytics.dto.ts";
import { RestaurantOrderAnalyticsMapper } from "@application/mappers/orders/restaurant-order-analytics.mapper.ts";
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
		input: GetRestaurantOrderAnalyticsInputDTO,
	): Promise<RestaurantOrderAnalyticsSummaryResponseDTO> {
		const range = resolveAnalyticsDateRange({
			interval: input.interval,
			day: input.day,
			month: input.month,
			year: input.year,
			timezone: input.timezone,
		});

		const result = await this.orderRepository.getRestaurantOrderAnalytics({
			restaurantId: input.restaurantId,
			startDate: range.startDate,
			nextPeriodStart: range.nextPeriodStart,
			prevStartDate: range.prevStartDate,
		});

		return RestaurantOrderAnalyticsMapper.toDTO(
			input.restaurantId,
			range,
			result,
		);
	}
}
