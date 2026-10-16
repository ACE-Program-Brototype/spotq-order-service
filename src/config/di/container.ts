import "reflect-metadata";
import type { IMenuItemCatalogPort } from "@application/ports/gateways/menu-item-catalog.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/update-cart-item-quantity.use-case.port.ts";
import { AddCartItemUseCase } from "@application/use-cases/add-cart-item.use-case.ts";
import { GetCartUseCase } from "@application/use-cases/get-cart.use-case.ts";
import { RemoveCartItemUseCase } from "@application/use-cases/remove-cart-item.use-case.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/update-cart-item-quantity.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { MenuItemCatalogGateway } from "@infrastructure/gateways/menu-item-catalog.gateway.ts";
import { PrismaCartRepository } from "@infrastructure/repositories/prisma-cart.repository.ts";
import { AddCartItemController } from "@interfaces/controllers/add-cart-item.controller.ts";
import { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
import { RemoveCartItemController } from "@interfaces/controllers/remove-cart-item.controller.ts";
import { UpdateCartItemQuantityController } from "@interfaces/controllers/update-cart-item-quantity.controller.ts";
import { Container } from "inversify";

const container = new Container();

container.bind(TYPES.PrismaClient).toConstantValue(prisma);

container
	.bind<ICartRepository>(TYPES.CartRepository)
	.to(PrismaCartRepository)
	.inSingletonScope();

container
	.bind<IMenuItemCatalogPort>(TYPES.MenuItemCatalogPort)
	.to(MenuItemCatalogGateway)
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
	.bind<IAddCartItemUseCase>(TYPES.AddCartItemUseCase)
	.to(AddCartItemUseCase)
	.inSingletonScope();

container
	.bind<AddCartItemController>(TYPES.AddCartItemController)
	.to(AddCartItemController)
	.inSingletonScope();

container
	.bind<IUpdateCartItemQuantityUseCase>(TYPES.UpdateCartItemQuantityUseCase)
	.to(UpdateCartItemQuantityUseCase)
	.inSingletonScope();

container
	.bind<UpdateCartItemQuantityController>(
		TYPES.UpdateCartItemQuantityController,
	)
	.to(UpdateCartItemQuantityController)
	.inSingletonScope();

container
	.bind<IRemoveCartItemUseCase>(TYPES.RemoveCartItemUseCase)
	.to(RemoveCartItemUseCase)
	.inSingletonScope();

container
	.bind<RemoveCartItemController>(TYPES.RemoveCartItemController)
	.to(RemoveCartItemController)
	.inSingletonScope();

export { container };
export default container;
