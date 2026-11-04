import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { RestaurantOrderController } from "@presentation/http/controllers/restaurant-order.controller.ts";
import { restaurantAdminAuthMiddleware } from "@presentation/http/middleware/restaurant-admin-auth.middleware.ts";
import {
	validateRequestParams,
	validateRequestQuery,
} from "@presentation/http/middleware/validation.middleware.ts";
import { ordersOverviewQuerySchema } from "@presentation/http/validators/orders/orders-overview-query.schema.ts";
import { restaurantIdParamSchema } from "@presentation/http/validators/restaurant-id-param.schema.ts";
import { RESTAURANT_ORDER_ROUTES } from "@shared/constants/routes.constants.ts";
import { Router } from "express";
import { restaurantOrderDetailsParamSchema } from "../validators/orders/restaurant-order-details-param.schema";
import { restaurantOrderListQuerySchema } from "../validators/orders/restaurant-orders-list-query.schema";

const restaurantOrderRouter: Router = Router();

const restaurantOrderController = container.get<RestaurantOrderController>(
	TYPES.RestaurantOrderController,
);

restaurantOrderRouter.get(
	RESTAURANT_ORDER_ROUTES.OVERVIEW,
	restaurantAdminAuthMiddleware,
	validateRequestParams(restaurantIdParamSchema),
	validateRequestQuery(ordersOverviewQuerySchema),
	restaurantOrderController.getOrdersOverview,
);

restaurantOrderRouter.get(
	RESTAURANT_ORDER_ROUTES.LIST,
	restaurantAdminAuthMiddleware,
	validateRequestParams(restaurantIdParamSchema),
	validateRequestQuery(restaurantOrderListQuerySchema),
	restaurantOrderController.getRestaurantOrderList,
);

restaurantOrderRouter.get(
	RESTAURANT_ORDER_ROUTES.DETAILS,
	restaurantAdminAuthMiddleware,
	validateRequestParams(restaurantOrderDetailsParamSchema),
	restaurantOrderController.getRestaurantOrderDetails,
);
export default restaurantOrderRouter;
