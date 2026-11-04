import type { GetOrdersOverviewInputDTO } from "@application/dtos/orders/get-orders-overview.dto.ts";
import type { GetRestaurantOrderDetailsInputDTO } from "@application/dtos/orders/get-restaurant-order-details.dto";
import type { OrdersOverviewQuery } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
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
