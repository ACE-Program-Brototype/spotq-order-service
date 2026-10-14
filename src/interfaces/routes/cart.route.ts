import { CART_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { AddCartItemController } from "@interfaces/controllers/add-cart-item.controller.ts";
import type { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
} from "@interfaces/middleware/validation.middleware.ts";
import { addCartItemBodySchema } from "@interfaces/validation/add-cart-item.schema.ts";
import { cartIdParamSchema } from "@interfaces/validation/cart-param.schema.ts";
import { Router } from "express";

const cartRouter: Router = Router();

const getCartController = container.get<GetCartController>(
	TYPES.GetCartController,
);
const addCartItemController = container.get<AddCartItemController>(
	TYPES.AddCartItemController,
);

cartRouter.get(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	(req, res) => getCartController.getCart(req, res),
);

cartRouter.post(
	CART_ROUTES.ITEMS,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	validateRequestBody(addCartItemBodySchema),
	(req, res) => addCartItemController.addItem(req, res),
);

export default cartRouter;
