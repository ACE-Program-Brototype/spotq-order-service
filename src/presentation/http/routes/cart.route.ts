import { container } from "@config/di/container.ts";
import { TYPES } from "@config/di/types.ts";
import type { CartController } from "@presentation/http/controllers/cart.controller.ts";
import { customerAuthMiddleware } from "@presentation/http/middleware/customer-auth.middleware.ts";
import {
	validateRequestBody,
	validateRequestParams,
} from "@presentation/http/middleware/validation.middleware.ts";
import { addBatchCartItemsBodySchema } from "@presentation/http/validators/cart/add-batch-cart-items.schema.ts";
import { addCartItemBodySchema } from "@presentation/http/validators/cart/add-cart-item.schema.ts";
import { cartItemParamSchema } from "@presentation/http/validators/cart/cart-item-param.schema.ts";
import { cartIdParamSchema } from "@presentation/http/validators/cart/cart-param.schema.ts";
import { updateCartItemQuantityBodySchema } from "@presentation/http/validators/cart/update-cart-quantity.schema.ts";
import { CART_ROUTES } from "@shared/constants/routes.constants.ts";
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
	CART_ROUTES.ITEMS_BATCH,
	customerAuthMiddleware,
	validateRequestBody(addBatchCartItemsBodySchema),
	cartController.addItemsBatch,
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
