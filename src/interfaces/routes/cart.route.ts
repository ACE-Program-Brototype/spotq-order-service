import { CART_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CartController } from "@interfaces/controllers/cart.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
} from "@interfaces/middleware/validation.middleware.ts";
import { addCartItemBodySchema } from "@interfaces/validation/add-cart-item.schema.ts";
import { cartItemParamSchema } from "@interfaces/validation/cart-item-param.schema.ts";
import { cartIdParamSchema } from "@interfaces/validation/cart-param.schema.ts";
import {
	updateCartItemQuantityBodySchema,
	updateCartItemQuantityParamSchema,
} from "@interfaces/validation/update-cart-quantity.schema.ts";
import { Router } from "express";

const cartRouter: Router = Router();

const cartController = container.get<CartController>(TYPES.CartController);

cartRouter.get(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	cartController.getCart,
);

cartRouter.delete(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	cartController.clearCart,
);

cartRouter.post(
	CART_ROUTES.ITEMS,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	validateRequestBody(addCartItemBodySchema),
	cartController.addItem,
);

cartRouter.patch(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(updateCartItemQuantityParamSchema),
	validateRequestBody(updateCartItemQuantityBodySchema),
	cartController.updateQuantity,
);

cartRouter.delete(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartItemParamSchema),
	cartController.removeItem,
);

export default cartRouter;
