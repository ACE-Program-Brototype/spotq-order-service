import { RESTAURANT_ORDER_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { RestaurantOrderController } from "@interfaces/controllers/restaurant-order.controller.ts";
import { restaurantAdminAuthMiddleware } from "@interfaces/middleware/restaurant-admin-auth.middleware.ts";
import {
	validateRequestParams,
	validateRequestQuery,
} from "@interfaces/middleware/validation.middleware.ts";
import { ordersOverviewQuerySchema } from "@interfaces/validation/orders-overview-query.schema.ts";
import { restaurantIdParamSchema } from "@interfaces/validation/restaurant-id-param.schema.ts";
import { Router } from "express";

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

export default restaurantOrderRouter;
