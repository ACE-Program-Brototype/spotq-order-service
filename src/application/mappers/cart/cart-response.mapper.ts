import type { GetCartResponseDTO } from "@application/dtos/cart/get-cart.dto.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";

export interface CartMutationResponseDTO {
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

export type CartMutationResponseDto = CartMutationResponseDTO;

export const CartResponseMapper = {
	toDTO(cart: Cart): GetCartResponseDTO {
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

	toMutationDTO(cart: Cart): CartMutationResponseDTO {
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
