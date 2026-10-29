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

export interface BatchCartItemCandidate {
	menuItemId: string;
	variantId?: string | null | undefined;
	addonIds?: string[] | undefined;
	quantity: number;
	specialInstructions?: string | null | undefined;
}

export interface MergedBatchCartItem {
	menuItemId: string;
	variantId: string | null;
	addonIds: string[];
	quantity: number;
	specialInstructions: string | null;
}

export interface UpdateCartInput {
	status?: CartStatus;
	expiresAt?: Date;
}

export interface AddItemInput {
	cartId?: string | undefined;
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

export interface ReplaceCartBatchItemInput {
	menuItemId: string;
	menuItemName: string;
	variantId: string | null;
	variantName: string | null;
	quantity: number;
	specialInstructions: string | null;
	unitPrice: number;
	totalPrice: number;
	itemAddons: Array<{ addonId: string; price: number; name: string }>;
}

export interface ReplaceCartBatchInput {
	userId: string;
	restaurantId: string;
	items: ReplaceCartBatchItemInput[];
}
