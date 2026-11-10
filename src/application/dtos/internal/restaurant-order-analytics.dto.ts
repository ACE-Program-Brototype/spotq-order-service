import type { AnalyticsInterval } from "@application/utils/date-range.util.ts";
import type { OrderStatusDistributionData } from "@domain/types/order-repository.types.ts";

export interface GetRestaurantOrderAnalyticsInputDTO {
	restaurantId: string;
	interval?: AnalyticsInterval | undefined;
	day?: number | undefined;
	month?: number | undefined;
	year?: number | undefined;
	timezone?: string | undefined;
}

export interface RestaurantOrderAnalyticsSummaryResponseDTO {
	restaurantId: string;
	timezone: string;
	overview: {
		revenue: {
			grossSalesRupees: number;
			discountRupees: number;
			netSalesRupees: number;
			taxCollectedRupees: number;
			totalBillAmountRupees: number;
			growthPercentage: number;
		};
		orders: {
			totalOrderCount: number;
			growthPercentage: number;
			dineInCount: number;
			takeawayCount: number;
		};
		operations: {
			dinersServedCount: number;
			uniqueCustomersCount: number;
		};
	};
	orderStatusBreakdown: {
		totalOrdersTracked: number;
		distribution: OrderStatusDistributionData[];
	};
	filters: {
		interval: AnalyticsInterval;
		day: number;
		month: number;
		year: number;
		timezone: string;
	};
	generatedAt: string;
}
