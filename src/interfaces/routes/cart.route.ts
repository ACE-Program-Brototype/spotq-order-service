import { CART_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CartController } from "@interfaces/controllers/cart.controller.ts";
import { customerAuthMiddleware } from "@interfaces/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
} from "@interfaces/middleware/validation.middleware.ts";
import { addCartItemBodySchema } from "@interfaces/validation/cart/add-cart-item.schema.ts";
import { cartItemParamSchema } from "@interfaces/validation/cart/cart-item-param.schema.ts";
import { cartIdParamSchema } from "@interfaces/validation/cart/cart-param.schema.ts";
import { updateCartItemQuantityBodySchema } from "@interfaces/validation/cart/update-cart-quantity.schema.ts";
import { Router } from "express";

export const cartRouter: Router = Router();

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
	validateRequestBody(addCartItemBodySchema),
	cartController.addItem,
);

cartRouter.patch(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartItemParamSchema),
	validateRequestBody(updateCartItemQuantityBodySchema),
	cartController.updateQuantity,
);

cartRouter.delete(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartItemParamSchema),
	cartController.removeItem,
);
