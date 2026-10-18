import type { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface CartItemAddonProps {
	id: string;
	cartItemId: string;
	addonId: string;
	addonName?: string | undefined;
	price?: number | undefined;
}

export interface CartItemProps {
	id: string;
	cartId: string;
	menuItemId: string;
	menuItemName?: string | undefined;
	variantId?: string | null | undefined;
	variantName?: string | null | undefined;
	quantity: number;
	unitPrice?: number | undefined;
	totalPrice?: number | undefined;
	specialInstructions?: string | null | undefined;
	addons?: CartItemAddonProps[] | undefined;
	createdAt?: Date | undefined;
	updatedAt?: Date | undefined;
}

export interface CartProps {
	id: string;
	restaurantId: string;
	userId: string;
	status: CartStatus;
	expiresAt: Date;
	items?: CartItemProps[] | undefined;
	createdAt?: Date | undefined;
	updatedAt?: Date | undefined;
}
