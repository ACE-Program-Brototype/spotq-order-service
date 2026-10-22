import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface UpdateCartInput {
	status?: CartStatus;
	expiresAt?: Date;
}

export interface AddItemInput {
	cartId: string;
	userId?: string;
	restaurantId?: string;
	menuItemId: string;
	menuItemName: string;
	variantId?: string | null;
	variantName?: string | null;
	addonIds?: string[];
	quantity: number;
	specialInstructions?: string | null;
	unitPrice: number;
	itemAddons: Array<{ addonId: string; price: number; name: string }>;
}
export interface ICartRepository {
	findById(cartId: string): Promise<Cart | null>;
	findActiveByUserId(
		userId: string,
		restaurantId?: string,
	): Promise<Cart | null>;
	addItem(input: AddItemInput): Promise<Cart>;
	update(cartId: string, data: UpdateCartInput): Promise<Cart | null>;
	updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart>;
	removeItem(cartId: string, cartItemId: string): Promise<Cart>;
	clearCart(cartId: string): Promise<Cart>;
}
