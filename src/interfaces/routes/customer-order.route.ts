import { ORDER_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CustomerOrderController } from "@interfaces/controllers/customer-order.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
	validateRequestQuery,
} from "@interfaces/middleware/validation.middleware.ts";
import { placeOrderBodySchema } from "@interfaces/validation/order/place-order.schema.ts";
import { orderHistoryQuerySchema } from "@interfaces/validation/order-history-query.schema.ts";
import { cancelOrderBodySchema } from "@interfaces/validation/orders/cancel-order-body.schema.ts";
import { cancelOrderParamSchema } from "@interfaces/validation/orders/cancel-order-param.schema.ts";
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
