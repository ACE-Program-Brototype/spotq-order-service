import "reflect-metadata";
import type { IGetCartUseCase } from "@application/ports/use-cases/get-cart.use-case.port.ts";
import { GetCartUseCase } from "@application/use-cases/get-cart.use-case.ts";
import { TYPES } from "@config/di/types.ts";
import type { ICartRepository } from "@domain/repositories/cart.repository.interface.ts";
import prisma from "@infrastructure/database/prisma.ts";
import { PrismaCartRepository } from "@infrastructure/repositories/prisma-cart.repository.ts";
import { GetCartController } from "@interfaces/controllers/get-cart.controller.ts";
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

export { container };
export default container;
