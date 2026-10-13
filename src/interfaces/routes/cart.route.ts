import { CART_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import { validateRequestParams } from "@interfaces/middleware/validation.middleware.ts";
import { cartIdParamSchema } from "@interfaces/validation/cart-param.schema.ts";
import { Router } from "express";

const cartRouter: Router = Router();

const getCartController = container.get<GetCartController>(
	TYPES.GetCartController,
);

cartRouter.get(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	(req, res) => getCartController.getCart(req, res),
);

export default cartRouter;
