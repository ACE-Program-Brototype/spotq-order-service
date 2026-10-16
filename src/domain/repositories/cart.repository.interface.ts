import type { Cart } from "@domain/entities/cart.entity.ts";
import type { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type { IBaseRepository } from "./base.repository.interface.ts";

export interface UpdateCartInput {
	status?: CartStatus;
	expiresAt?: Date;
}

export interface AddItemInput {
	cartId: string;
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

export interface ICartRepository
	extends IBaseRepository<Cart, unknown, UpdateCartInput> {
	addItem(input: AddItemInput): Promise<Cart>;
	updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart>;
	removeItem(cartId: string, cartItemId: string): Promise<Cart>;
	clearCart(cartId: string): Promise<Cart>;
}
