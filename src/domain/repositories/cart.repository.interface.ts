import type { Cart } from "@domain/entities/cart.entity.ts";
import type {
	AddItemInput,
	ReplaceCartBatchInput,
	UpdateCartInput,
} from "@domain/types/cart.types.ts";

export type {
	AddItemInput,
	ReplaceCartBatchInput,
	ReplaceCartBatchItemInput,
	UpdateCartInput,
} from "@domain/types/cart.types.ts";

export interface ICartRepository {
	findById(cartId: string): Promise<Cart | null>;
	findActiveByUserId(
		userId: string,
		restaurantId?: string,
	): Promise<Cart | null>;
	addItem(input: AddItemInput): Promise<Cart>;
	replaceCartItemsBatch(input: ReplaceCartBatchInput): Promise<Cart>;
	update(cartId: string, data: UpdateCartInput): Promise<Cart | null>;
	updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart>;
	removeItem(cartId: string, cartItemId: string): Promise<Cart>;
	clearCart(cartId: string): Promise<Cart>;
}
