import { ORDER_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { OrderController } from "@interfaces/controllers/order.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import { validateRequestBody } from "@interfaces/middleware/validation.middleware.ts";
import { placeOrderBodySchema } from "@interfaces/validation/order/place-order.schema.ts";
import { Router } from "express";

export const orderRouter: Router = Router();

const orderController = container.get<OrderController>(TYPES.OrderController);

orderRouter.post(
	ORDER_ROUTES.PLACE,
	customerAuthMiddleware,
	validateRequestBody(placeOrderBodySchema),
	orderController.placeOrder,
);

export default orderRouter;
