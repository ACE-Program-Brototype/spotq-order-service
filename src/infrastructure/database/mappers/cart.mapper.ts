import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type { IEntityMapper } from "@infrastructure/database/repositories/prisma-base.repository.ts";

export type PrismaCartRecord = {
	id: string;
	restaurantId: string;
	userId: string;
	expiresAt: Date;
	createdAt: Date;
	updatedAt: Date;
	items?: Array<{
		id: string;
		cartId: string;
		menuItemId: string;
		menuItemName?: string | null;
		variantId?: string | null;
		variantName?: string | null;
		quantity: number;
		unitPrice: unknown;
		totalPrice: unknown;
		specialInstructions?: string | null;
		addons?: Array<{
			id: string;
			cartItemId: string;
			addonId: string;
			addonName?: string | null;
			price: unknown;
		}>;
		createdAt: Date;
		updatedAt: Date;
	}>;
};

export const CartPersistenceMapper: IEntityMapper<Cart, PrismaCartRecord> = {
	toDomain(record: PrismaCartRecord): Cart {
		const isExpired = Date.now() > record.expiresAt.getTime();
		const status = isExpired ? CartStatus.EXPIRED : CartStatus.ACTIVE;

		const items = (record.items ?? []).map(
			(item) =>
				new CartItem({
					id: item.id,
					cartId: item.cartId,
					menuItemId: item.menuItemId,
					menuItemName: item.menuItemName ?? undefined,
					variantId: item.variantId ?? null,
					variantName: item.variantName ?? null,
					quantity: item.quantity,
					unitPrice: Number(item.unitPrice),
					totalPrice: Number(item.totalPrice),
					specialInstructions: item.specialInstructions ?? null,
					addons: (item.addons ?? []).map(
						(addon) =>
							new CartItemAddon({
								id: addon.id,
								cartItemId: addon.cartItemId,
								addonId: addon.addonId,
								addonName: addon.addonName ?? undefined,
								price: Number(addon.price),
							}),
					),
					createdAt: item.createdAt,
					updatedAt: item.updatedAt,
				}),
		);

		return new Cart({
			id: record.id,
			restaurantId: record.restaurantId,
			userId: record.userId,
			status,
			expiresAt: record.expiresAt,
			items,
			createdAt: record.createdAt,
			updatedAt: record.updatedAt,
		});
	},
};
