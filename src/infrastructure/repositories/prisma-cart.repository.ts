import { TYPES } from "@config/di/types.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type {
	ICartRepository,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";
import type { PrismaClient } from "@generated/prisma/client.ts";
import { PrismaBaseRepository } from "@infrastructure/repositories/prisma-base.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class PrismaCartRepository
	extends PrismaBaseRepository
	implements ICartRepository
{
	constructor(
		@inject(TYPES.PrismaClient)
		private readonly prisma: PrismaClient,
	) {
		super();
	}

	public async findById(cartId: string): Promise<Cart | null> {
		const record = await this.prisma.cart.findUnique({
			where: { id: cartId },
			include: {
				items: {
					include: {
						addons: true,
					},
				},
			},
		});

		if (!record) {
			return null;
		}

		const isExpired = Date.now() > record.expiresAt.getTime();
		const status = isExpired ? CartStatus.EXPIRED : CartStatus.ACTIVE;

		const items = record.items.map(
			(item) =>
				new CartItem({
					id: item.id,
					cartId: item.cartId,
					menuItemId: item.menuItemId,
					variantId: item.variantId,
					quantity: item.quantity,
					specialInstructions: item.specialInstructions,
					addons: item.addons.map(
						(addon) =>
							new CartItemAddon({
								id: addon.id,
								cartItemId: addon.cartItemId,
								addonId: addon.addonId,
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
	}

	public async update(
		cartId: string,
		data: UpdateCartInput,
	): Promise<Cart | null> {
		const updateData: { expiresAt?: Date } = {};
		if (data.status === CartStatus.EXPIRED) {
			updateData.expiresAt = data.expiresAt ?? new Date();
		} else if (data.expiresAt) {
			updateData.expiresAt = data.expiresAt;
		}

		if (Object.keys(updateData).length > 0) {
			await this.prisma.cart.update({
				where: { id: cartId },
				data: updateData,
			});
		}

		return this.findById(cartId);
	}
}

export default PrismaCartRepository;
