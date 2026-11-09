import type { AnalyticsInterval } from "@application/utils/date-range.util.ts";
import type {
	ProductAnalyticsPaginationData,
	ProductPerformanceItemData,
} from "@domain/types/order-repository.types.ts";

export interface GetRestaurantProductAnalyticsInputDto {
	restaurantId: string;
	interval?: AnalyticsInterval | undefined;
	day?: number | undefined;
	month?: number | undefined;
	year?: number | undefined;
	timezone?: string | undefined;
	page?: number | undefined;
	limit?: number | undefined;
}

export interface RestaurantProductAnalyticsResponseDto {
	restaurantId: string;
	timezone: string;
	totalProductsSold: number;
	topSelling: {
		items: ProductPerformanceItemData[];
		pagination: ProductAnalyticsPaginationData;
	};
	slowMoving: {
		items: ProductPerformanceItemData[];
		pagination: ProductAnalyticsPaginationData;
	};
	filters: {
		interval: AnalyticsInterval;
		day: number;
		month: number;
		year: number;
		page: number;
		limit: number;
	};
	generatedAt: string;
}
