import { CART_ROUTES } from "@common/constants/routes.constants.ts";
import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { AddCartItemController } from "@interfaces/controllers/add-cart-item.controller.ts";
import type { ClearCartController } from "@interfaces/controllers/clear-cart.controller.ts";
import type { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import type { RemoveCartItemController } from "@interfaces/controllers/remove-cart-item.controller.ts";
import type { UpdateCartItemQuantityController } from "@interfaces/controllers/update-cart-item-quantity.controller.ts";
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

const getCartController = container.get<GetCartController>(
	TYPES.GetCartController,
);
const addCartItemController = container.get<AddCartItemController>(
	TYPES.AddCartItemController,
);
const updateCartItemQuantityController =
	container.get<UpdateCartItemQuantityController>(
		TYPES.UpdateCartItemQuantityController,
	);
const removeCartItemController = container.get<RemoveCartItemController>(
	TYPES.RemoveCartItemController,
);
const clearCartController = container.get<ClearCartController>(
	TYPES.ClearCartController,
);

cartRouter.get(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	(req, res) => getCartController.getCart(req, res),
);

cartRouter.delete(
	CART_ROUTES.BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	(req, res) => clearCartController.clearCart(req, res),
);

cartRouter.post(
	CART_ROUTES.ITEMS,
	customerAuthMiddleware,
	validateRequestParams(cartIdParamSchema),
	validateRequestBody(addCartItemBodySchema),
	(req, res) => addCartItemController.addItem(req, res),
);

cartRouter.patch(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(updateCartItemQuantityParamSchema),
	validateRequestBody(updateCartItemQuantityBodySchema),
	(req, res) => updateCartItemQuantityController.updateQuantity(req, res),
);

cartRouter.delete(
	CART_ROUTES.ITEM_BY_ID,
	customerAuthMiddleware,
	validateRequestParams(cartItemParamSchema),
	(req, res) => removeCartItemController.removeItem(req, res),
);

export default cartRouter;
