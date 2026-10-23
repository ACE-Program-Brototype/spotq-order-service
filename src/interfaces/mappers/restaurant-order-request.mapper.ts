import type { GetOrdersOverviewInputDto } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { OrdersOverviewQuery } from "@interfaces/validation/orders/orders-overview-query.schema.ts";
import type { Request } from "express";

export const RestaurantOrderRequestMapper = {
	toOrdersOverviewInputDto(req: Request): GetOrdersOverviewInputDto {
		const query = req.query as unknown as OrdersOverviewQuery;
		return {
			restaurantId: req.params.restaurantId as string,
			from: query?.from,
			to: query?.to,
			status: query?.status,
			search: query?.search,
			page: query?.page ?? 1,
			limit: query?.limit ?? 20,
		};
	},
};

export default RestaurantOrderRequestMapper;
