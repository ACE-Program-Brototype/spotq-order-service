import type { GetCartResponseDto } from "@application/dtos/get-cart.dto.ts";
import type { Cart } from "@domain/entities/cart.entity.ts";

export const CartResponseMapper = {
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
				id: item.id,
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
};

export default CartResponseMapper;
