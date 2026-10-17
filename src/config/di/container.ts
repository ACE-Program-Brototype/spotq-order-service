import "reflect-metadata";
import type { IRestaurantServiceClient } from "@application/ports/external/restaurant-service.client.port";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import type { IGetOrdersOverviewUseCase } from "@application/ports/use-cases/get-orders-overview.use-case.port.ts";
import { GetCartUseCase } from "@application/use-cases/get-cart.use-case.ts";
import { GetOrdersOverviewUseCase } from "@application/use-cases/get-orders-overview.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { RestaurantServiceClient } from "@infrastructure/external/restaurant-service.client.ts";
import { PrismaCartRepository } from "@infrastructure/repositories/prisma-cart.repository.ts";
import { PrismaOrderRepository } from "@infrastructure/repositories/prisma-order.repository.ts";
import { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import { RestaurantOrderController } from "@interfaces/controllers/restaurant-order.controller.ts";
import { Container } from "inversify";

const container = new Container();

container.bind(TYPES.PrismaClient).toConstantValue(prisma);

container
	.bind<ICartRepository>(TYPES.CartRepository)
	.to(PrismaCartRepository)
	.inSingletonScope();

container
	.bind<IGetCartUseCase>(TYPES.GetCartUseCase)
	.to(GetCartUseCase)
	.inSingletonScope();

container
	.bind<GetCartController>(TYPES.GetCartController)
	.to(GetCartController)
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

export { container };
export default container;
