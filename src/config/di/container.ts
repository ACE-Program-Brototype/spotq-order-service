import "reflect-metadata";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port";
import { AddCartItemUseCase } from "@application/use-cases/cart/add-cart-item.use-case.ts";
import { ClearCartUseCase } from "@application/use-cases/cart/clear-cart.use-case.ts";
import { GetCartUseCase } from "@application/use-cases/cart/get-cart.use-case.ts";
import { RemoveCartItemUseCase } from "@application/use-cases/cart/remove-cart-item.use-case.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/cart/update-cart-item-quantity.use-case.ts";
import { GetOrderHistoryUseCase } from "@application/use-cases/orders/get-order-history.use-case.ts";
import { GetOrdersOverviewUseCase } from "@application/use-cases/orders/get-orders-overview.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { MenuItemCatalogClient } from "@infrastructure/external/menu-item-catalog.client.ts";
import { RestaurantServiceClient } from "@infrastructure/external/restaurant-service.client.ts";
import { PrismaCartRepository } from "@infrastructure/repositories/prisma-cart.repository.ts";
import { PrismaOrderRepository } from "@infrastructure/repositories/prisma-order.repository.ts";
import { CartController } from "@interfaces/controllers/cart.controller.ts";
import { CustomerOrderController } from "@interfaces/controllers/customer-order.controller.ts";
import { RestaurantOrderController } from "@interfaces/controllers/restaurant-order.controller.ts";
import { Container } from "inversify";

const container = new Container();

container.bind(TYPES.PrismaClient).toConstantValue(prisma);

container
	.bind<ICartRepository>(TYPES.CartRepository)
	.to(PrismaCartRepository)
	.inSingletonScope();

container
	.bind<IMenuItemCatalogPort>(TYPES.MenuItemCatalogPort)
	.to(MenuItemCatalogClient)
	.inSingletonScope();

container
	.bind<IGetCartUseCase>(TYPES.GetCartUseCase)
	.to(GetCartUseCase)
	.inSingletonScope();

container
	.bind<IAddCartItemUseCase>(TYPES.AddCartItemUseCase)
	.to(AddCartItemUseCase)
	.inSingletonScope();

container
	.bind<IUpdateCartItemQuantityUseCase>(TYPES.UpdateCartItemQuantityUseCase)
	.to(UpdateCartItemQuantityUseCase)
	.inSingletonScope();

container
	.bind<IRemoveCartItemUseCase>(TYPES.RemoveCartItemUseCase)
	.to(RemoveCartItemUseCase)
	.inSingletonScope();

container
	.bind<IClearCartUseCase>(TYPES.ClearCartUseCase)
	.to(ClearCartUseCase)
	.inSingletonScope();

container
	.bind<CartController>(TYPES.CartController)
	.to(CartController)
	.inSingletonScope();

container
	.bind<IRestaurantServiceClient>(TYPES.RestaurantServiceClient)
	.to(RestaurantServiceClient)
	.inSingletonScope();

container
	.bind<IOrderRepository>(TYPES.OrderRepository)
	.to(PrismaOrderRepository)
	.inSingletonScope();

container
	.bind<IGetOrdersOverviewUseCase>(TYPES.GetOrdersOverviewUseCase)
	.to(GetOrdersOverviewUseCase)
	.inSingletonScope();

container
	.bind<RestaurantOrderController>(TYPES.RestaurantOrderController)
	.to(RestaurantOrderController)
	.inSingletonScope();

container
	.bind<IGetOrderHistoryUseCase>(TYPES.GetOrderHistoryUseCase)
	.to(GetOrderHistoryUseCase)
	.inSingletonScope();

container
	.bind<CustomerOrderController>(TYPES.CustomerOrderController)
	.to(CustomerOrderController)
	.inSingletonScope();

export { container };
