import "reflect-metadata";
import type { IMenuItemCatalogPort } from "@application/ports/external/menu-item-catalog.port.ts";
import type { IAddCartItemUseCase } from "@application/ports/use-cases/add-cart-item.use-case.port.ts";
import type { IClearCartUseCase } from "@application/ports/use-cases/clear-cart.use-case.port.ts";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import type { IRemoveCartItemUseCase } from "@application/ports/use-cases/remove-cart-item.use-case.port.ts";
import type { IUpdateCartItemQuantityUseCase } from "@application/ports/use-cases/update-cart-item-quantity.use-case.port.ts";
import { AddCartItemUseCase } from "@application/use-cases/add-cart-item.use-case.ts";
import { ClearCartUseCase } from "@application/use-cases/clear-cart.use-case.ts";
import { GetCartUseCase } from "@application/use-cases/get-cart.use-case.ts";
import { RemoveCartItemUseCase } from "@application/use-cases/remove-cart-item.use-case.ts";
import { UpdateCartItemQuantityUseCase } from "@application/use-cases/update-cart-item-quantity.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { MenuItemCatalogGateway } from "@infrastructure/external/menu-item-catalog.client.ts";
import { PrismaCartRepository } from "@infrastructure/repositories/prisma-cart.repository.ts";
import { CartController } from "@interfaces/controllers/cart.controller.ts";
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

export { container };
export default container;
