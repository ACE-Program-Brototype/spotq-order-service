import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface ICartRepository {
	findById(cartId: string): Promise<Cart | null>;
	updateStatus(cartId: string, status: CartStatus): Promise<void>;
}

export default ICartRepository;
