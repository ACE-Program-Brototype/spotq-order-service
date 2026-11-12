import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { AdminOrderController } from "@presentation/http/controllers/admin-order.controller.ts";
import { adminAuthMiddleware } from "@presentation/http/middleware/admin-auth.middleware.ts";
import { validateRequestQuery } from "@presentation/http/middleware/validation.middleware.ts";
import { adminOrdersListQuerySchema } from "@presentation/http/validators/orders/admin-orders-list-query.schema.ts";
import { ADMIN_ORDER_ROUTES } from "@shared/constants/routes.constants.ts";
import { Router } from "express";

const adminOrderRouter: Router = Router();

const adminOrderController = container.get<AdminOrderController>(
	TYPES.AdminOrderController,
);

adminOrderRouter.get(
	ADMIN_ORDER_ROUTES.LIST,
	adminAuthMiddleware,
	validateRequestQuery(adminOrdersListQuerySchema),
	adminOrderController.getAdminOrders,
);

export default adminOrderRouter;
