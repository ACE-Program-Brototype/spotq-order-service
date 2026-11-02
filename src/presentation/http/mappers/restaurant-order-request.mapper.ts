import type { GetOrdersOverviewInputDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetRestaurantOrdersListInputDTO } from "@application/dtos/orders/get-restaurant-orders.dto";
import type { OrdersOverviewQuery } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
import type { RestaurantOrderListQuery } from "@presentation/http/validators/orders/restaurant-orders-list-query.schema"
import type { Request } from "express";

export const RestaurantOrderRequestMapper = {
	toOrdersOverviewInputDTO(req: Request): GetOrdersOverviewInputDTO {
		const query = req.query as unknown as OrdersOverviewQuery;
		return {
			restaurantId: req.params.restaurantId as string,
			from: query?.from,
			to: query?.to,
		};
	},

	toRestaurantOrdersListInputDTO(req: Request): GetRestaurantOrdersListInputDTO{
		const query = req.query as unknown as RestaurantOrderListQuery;

		return{
			restaurantId:req.params.restaurantId as string,
			...(query.search !== undefined && { search:query.search}),
			...(query.status !== undefined && {status: query.status}),
			...(query.from !== undefined && {from :query.from}),
			...(query.to !== undefined && { to:query.to}),
			page:query.page,
			limit:query.limit
		}
	}


};

export default RestaurantOrderRequestMapper;
