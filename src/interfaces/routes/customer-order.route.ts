import { ORDER_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CustomerOrderController } from "@interfaces/controllers/customer-order.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import { validateRequestQuery } from "@interfaces/middleware/validation.middleware.ts";
import { orderHistoryQuerySchema } from "@interfaces/validation/order-history-query.schema.ts";
import { Router } from "express";

const customerOrderRouter: Router = Router();

const customerOrderController = container.get<CustomerOrderController>(
	TYPES.CustomerOrderController,
);

customerOrderRouter.get(
	ORDER_ROUTES.HISTORY,
	customerAuthMiddleware,
	validateRequestQuery(orderHistoryQuerySchema),
	customerOrderController.getOrderHistory,
);

export default customerOrderRouter;
