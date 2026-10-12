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
	"/:cartId",
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	(req, res, next) => getCartController.handle(req, res, next),
);

export default cartRouter;
