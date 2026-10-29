import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CustomerOrderController } from "@presentation/http/controllers/customer-order.controller.ts";
import { customerAuthMiddleware } from "@presentation/http/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
	validateRequestQuery,
} from "@presentation/http/middleware/validation.middleware.ts";
import {
	cancelOrderBodySchema,
	cancelOrderParamSchema,
} from "@presentation/http/validators/orders/cancel-order.schema.ts";
import { orderHistoryQuerySchema } from "@presentation/http/validators/orders/order-history-query.schema.ts";
import { placeOrderBodySchema } from "@presentation/http/validators/orders/place-order.schema.ts";
import { ORDER_ROUTES } from "@shared/constants/routes.constants.ts";
import { Router } from "express";

const customerOrderRouter: Router = Router();

const customerOrderController = container.get<CustomerOrderController>(
	TYPES.CustomerOrderController,
);

customerOrderRouter.post(
	ORDER_ROUTES.PLACE,
	customerAuthMiddleware,
	validateRequestBody(placeOrderBodySchema),
	customerOrderController.placeOrder,
);

customerOrderRouter.get(
	ORDER_ROUTES.HISTORY,
	customerAuthMiddleware,
	validateRequestQuery(orderHistoryQuerySchema),
	customerOrderController.getOrderHistory,
);

customerOrderRouter.post(
	ORDER_ROUTES.CANCEL,
	customerAuthMiddleware,
	validateRequestParams(cancelOrderParamSchema),
	validateRequestBody(cancelOrderBodySchema),
	customerOrderController.cancelOrder,
);

export default customerOrderRouter;
