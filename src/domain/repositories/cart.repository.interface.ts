import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type { IBaseRepository } from "./base.repository.interface.ts";

export interface UpdateCartInput {
	status?: CartStatus;
	expiresAt?: Date;
}

export interface ICartRepository
	extends IBaseRepository<Cart, unknown, UpdateCartInput> {}
