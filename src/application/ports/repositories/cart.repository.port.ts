import type { IBaseRepository } from "@application/ports/repositories/base.repository.port.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface UpdateCartInput {
	status?: CartStatus;
	expiresAt?: Date;
}

export interface ICartRepository
	extends IBaseRepository<Cart, unknown, UpdateCartInput> {
	update(id: string, data: UpdateCartInput): Promise<Cart | null>;
}

export default ICartRepository;
