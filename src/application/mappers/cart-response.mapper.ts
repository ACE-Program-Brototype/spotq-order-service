import type { GetCartResponseDto } from "@application/dtos/cart/get-cart.dto.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";

export interface CartMutationResponseDto {
	cartId: string;
	restaurantId: string;
	itemCount: number;
	subtotal: number;
	updatedAt: string;
	items: Array<{
		cartItemId: string;
		menuItemId: string;
		quantity: number;
		unitPrice: number;
		totalPrice: number;
	}>;
}

export const CartResponseMapper = {
	toEmptyDto(userId: string, restaurantId?: string): GetCartResponseDto {
		return {
			cartId: null,
			restaurantId: restaurantId ?? null,
			userId,
			status: CartStatus.ACTIVE,
			itemCount: 0,
			subtotal: 0,
			createdAt: null,
			updatedAt: null,
			expiresAt: null,
			items: [],
		};
	},

	toDto(cart: Cart): GetCartResponseDto {
		return {
			cartId: cart.id,
			restaurantId: cart.restaurantId,
			userId: cart.userId,
			status: cart.status,
			itemCount: cart.calculateItemCount(),
			subtotal: cart.calculateSubtotal(),
			createdAt: cart.createdAt.toISOString(),
			updatedAt: cart.updatedAt.toISOString(),
			expiresAt: cart.expiresAt.toISOString(),
			items: cart.items.map((item) => ({
				cartItemId: item.id,
				menuItemId: item.menuItemId,
				menuItemName: item.menuItemName ?? "",
				variantId: item.variantId,
				variantName: item.variantName ?? null,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
				specialInstructions: item.specialInstructions,
				addons: item.addons.map((addon) => ({
					addonId: addon.addonId,
					addonName: addon.addonName ?? "",
					price: addon.price,
				})),
			})),
		};
	},

	toMutationDto(cart: Cart): CartMutationResponseDto {
		return {
			cartId: cart.id,
			restaurantId: cart.restaurantId,
			itemCount: cart.calculateItemCount(),
			subtotal: cart.calculateSubtotal(),
			updatedAt: cart.updatedAt.toISOString(),
			items: cart.items.map((item) => ({
				cartItemId: item.id,
				menuItemId: item.menuItemId,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.totalPrice,
			})),
		};
	},
};
