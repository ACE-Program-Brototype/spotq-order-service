import type { GetOrdersOverviewInputDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { OrdersOverviewQuery } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
import type { Request } from "express";

export const RestaurantOrderRequestMapper = {
	toOrdersOverviewInputDTO(req: Request): GetOrdersOverviewInputDTO {
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

	toOrdersOverviewInputDto(req: Request): GetOrdersOverviewInputDTO {
		return this.toOrdersOverviewInputDTO(req);
	},
};

export default RestaurantOrderRequestMapper;
