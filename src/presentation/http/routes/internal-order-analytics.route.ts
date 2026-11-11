import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { IInternalOrderAnalyticsController } from "@presentation/http/controllers/internal/internal-order-analytics.controller.interface.ts";
import {
	internalS2SAuthMiddleware,
	requireCallerService,
} from "@presentation/http/middleware/internal-s2s-auth.middleware.ts";
import {
	validateRequestParams,
	validateRequestQuery,
} from "@presentation/http/middleware/validation.middleware.ts";
import {
	orderAnalyticsSummaryQuerySchema,
	orderProductAnalyticsQuerySchema,
} from "@presentation/http/validators/internal/order-analytics.validator.ts";
import { restaurantIdParamSchema } from "@presentation/http/validators/restaurant-id-param.schema.ts";
import { S2S_CALLER_SERVICES } from "@shared/constants/auth.constants.ts";
import { INTERNAL_ORDER_ANALYTICS_ROUTES } from "@shared/constants/routes.constants.ts";
import express, { type Router } from "express";

const internalOrderAnalyticsRouter: Router = express.Router();

const controller = container.get<IInternalOrderAnalyticsController>(
	TYPES.InternalOrderAnalyticsController,
);

internalOrderAnalyticsRouter.use(internalS2SAuthMiddleware());
internalOrderAnalyticsRouter.use(
	requireCallerService([S2S_CALLER_SERVICES.RESTAURANT_SERVICE]),
);

internalOrderAnalyticsRouter.get(
	INTERNAL_ORDER_ANALYTICS_ROUTES.SUMMARY,
	validateRequestParams(restaurantIdParamSchema),
	validateRequestQuery(orderAnalyticsSummaryQuerySchema),
	controller.getRestaurantOrderSummary,
);

internalOrderAnalyticsRouter.get(
	INTERNAL_ORDER_ANALYTICS_ROUTES.PRODUCTS,
	validateRequestParams(restaurantIdParamSchema),
	validateRequestQuery(orderProductAnalyticsQuerySchema),
	controller.getRestaurantProductAnalytics,
);

export default internalOrderAnalyticsRouter;
