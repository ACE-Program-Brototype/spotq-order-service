import "reflect-metadata";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IQueueServiceClient } from "@application/ports/external/queue-service.client.port.ts";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IAddBatchCartItemsUseCase } from "@application/ports/use-cases/cart/add-batch-cart-items.use-case.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/cart/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/cart/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/cart/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/cart/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/cart/update-cart-item-quantity.use-case.port.ts";
import type { ICancelOrderUseCase } from "@application/ports/use-cases/orders/cancel-order.use-case.port.ts";
import type { IGetOrderHistoryUseCase } from "@application/ports/use-cases/orders/get-order-history.use-case.port.ts";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/orders/get-orders-overview.use-case.port";
import type { IPlaceOrderUseCase } from "@application/ports/use-cases/orders/place-order.use-case.port.ts";
import { AddBatchCartItemsUseCase } from "@application/use-cases/cart/add-batch-cart-items.use-case.ts";
import { AddCartItemUseCase } from "@application/use-cases/cart/add-cart-item.use-case.ts";
import { ClearCartUseCase } from "@application/use-cases/cart/clear-cart.use-case.ts";
import { GetCartUseCase } from "@application/use-cases/cart/get-cart.use-case.ts";
import { RemoveCartItemUseCase } from "@application/use-cases/cart/remove-cart-item.use-case.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/cart/update-cart-item-quantity.use-case.ts";
import { CancelOrderUseCase } from "@application/use-cases/orders/cancel-order.use-case.ts";
import { GetOrderHistoryUseCase } from "@application/use-cases/orders/get-order-history.use-case.ts";
import { GetOrdersOverviewUseCase } from "@application/use-cases/orders/get-orders-overview.use-case.ts";
import { PlaceOrderUseCase } from "@application/use-cases/orders/place-order.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/i-cart.repository.ts";
import type { IOrderRepository } from "@domain/repositories/i-order.repository.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { PrismaCartRepository } from "@infrastructure/database/repositories/prisma-cart.repository.ts";
import { PrismaOrderRepository } from "@infrastructure/database/repositories/prisma-order.repository.ts";
import { MenuItemCatalogClient } from "@infrastructure/external/menu-item-catalog.client.ts";
import { QueueServiceClient } from "@infrastructure/external/queue-service.client.ts";
import { RestaurantServiceClient } from "@infrastructure/external/restaurant-service.client.ts";
import { CartController } from "@presentation/http/controllers/cart.controller.ts";
import { CustomerOrderController } from "@presentation/http/controllers/customer-order.controller.ts";
import { RestaurantOrderController } from "@presentation/http/controllers/restaurant-order.controller.ts";
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
	.bind<IAddBatchCartItemsUseCase>(TYPES.AddBatchCartItemsUseCase)
	.to(AddBatchCartItemsUseCase)
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
	.bind<ICancelOrderUseCase>(TYPES.CancelOrderUseCase)
	.to(CancelOrderUseCase)
	.inSingletonScope();

container
	.bind<CustomerOrderController>(TYPES.CustomerOrderController)
	.to(CustomerOrderController)
	.inSingletonScope();

container
	.bind<IQueueServiceClient>(TYPES.QueueServiceClient)
	.to(QueueServiceClient)
	.inSingletonScope();

container
	.bind<IPlaceOrderUseCase>(TYPES.PlaceOrderUseCase)
	.to(PlaceOrderUseCase)
	.inSingletonScope();

export { container };
