import type { CheckoutDetailsResponseDto } from "@application/dtos/orders/checkout-details.dto.ts";
import type { CheckoutDetails } from "@domain/entities/checkout.entity.ts";

export const CheckoutResponseMapper = {
	toDto(checkout: CheckoutDetails): CheckoutDetailsResponseDto {
		return {
			cartId: checkout.cartId,
			restaurantId: checkout.restaurantId,
			restaurantName: checkout.restaurantName,
			itemCount: checkout.itemCount,
			subtotal: checkout.subtotal,
			taxPercent: checkout.taxPercent,
			taxAmount: checkout.taxAmount,
			totalAmount: checkout.totalAmount,
			items: checkout.items.map((item) => ({
				cartItemId: item.cartItemId,
				menuItemId: item.menuItemId,
				name: item.name,
				variantId: item.variantId,
				variantName: item.variantName,
				quantity: item.quantity,
				unitPrice: item.unitPrice,
				totalPrice: item.lineTotal,
				specialInstructions: item.specialInstructions,
				addons: item.addons.map((addon) => ({
					addonId: addon.addonId,
					name: addon.name,
					price: addon.price,
				})),
			})),
		};
	},
};

export default CheckoutResponseMapper;
