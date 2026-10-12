import type { IBaseRepository } from "@application/ports/repositories/base.repository.port.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface ICartRepository extends IBaseRepository<Cart> {
	updateStatus(cartId: string, status: CartStatus): Promise<void>;
}

export default ICartRepository;
