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
import {
	cancelOrderBodySchema,
	cancelOrderParamSchema,
} from "@interfaces/validation/orders/cancel-order.schema.ts";
import { checkoutQuerySchema } from "@interfaces/validation/orders/checkout-query.schema.ts";
import { orderHistoryQuerySchema } from "@interfaces/validation/orders/order-history-query.schema.ts";
import { placeOrderBodySchema } from "@interfaces/validation/orders/place-order.schema.ts";
import { Router } from "express";

const customerOrderRouter: Router = Router();

const customerOrderController = container.get<CustomerOrderController>(
	TYPES.CustomerOrderController,
);

customerOrderRouter.get(
	ORDER_ROUTES.CHECKOUT,
	customerAuthMiddleware,
	validateRequestQuery(checkoutQuerySchema),
	customerOrderController.getCheckoutDetails,
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
