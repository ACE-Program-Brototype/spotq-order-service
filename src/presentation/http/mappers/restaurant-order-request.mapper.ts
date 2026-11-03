import type { GetOrdersOverviewInputDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetRestaurantOrderDetailsInputDTO } from "@application/dtos/orders/get-restaurant-order-details.dto";
import type { GetRestaurantOrdersListInputDTO } from "@application/dtos/orders/get-restaurant-orders.dto";
import type { OrdersOverviewQuery } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
import type { RestaurantOrderListQuery } from "@presentation/http/validators/orders/restaurant-orders-list-query.schema";
import type { Request } from "express";
import { RestaurantOrderDetailsParam } from "../validators/orders/restaurant-order-details-param.schema";

export const RestaurantOrderRequestMapper = {
	toOrdersOverviewInputDTO(req: Request): GetOrdersOverviewInputDTO {
		const query = req.query as unknown as OrdersOverviewQuery;
		return {
			restaurantId: req.params.restaurantId as string,
			from: query?.from,
			to: query?.to,
		};
	},

	toRestaurantOrdersListInputDTO(
		req: Request,
	): GetRestaurantOrdersListInputDTO {
		const query = req.query as unknown as RestaurantOrderListQuery;

		return {
			restaurantId: req.params.restaurantId as string,
			...(query.search !== undefined && { search: query.search }),
			...(query.status !== undefined && { status: query.status }),
			...(query.from !== undefined && { from: query.from }),
			...(query.to !== undefined && { to: query.to }),
			page: query.page,
			limit: query.limit,
		};
	},

	toRestaurantOrderDetailsInputDTO(
		req: Request,
	): GetRestaurantOrderDetailsInputDTO {
		return {
			restaurantId: req.params.restaurantId as string,
			orderId: req.params.orderId as string,
		};
	},
};

export default RestaurantOrderRequestMapper;
