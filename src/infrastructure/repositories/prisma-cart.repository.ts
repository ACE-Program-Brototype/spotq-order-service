import { TYPES } from "@config/di/types.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import type {
	AddItemInput,
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
					menuItemName: item.menuItemName,
					variantId: item.variantId,
					variantName: item.variantName,
					quantity: item.quantity,
					unitPrice: Number(item.unitPrice),
					totalPrice: Number(item.totalPrice),
					specialInstructions: item.specialInstructions,
					addons: item.addons.map(
						(addon) =>
							new CartItemAddon({
								id: addon.id,
								cartItemId: addon.cartItemId,
								addonId: addon.addonId,
								addonName: addon.addonName,
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

	public async addItem(input: AddItemInput): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingCart = await tx.cart.findUnique({
				where: { id: input.cartId },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			if (!existingCart) {
				throw new Error("Cart not found in repository");
			}

			const targetAddonSignature = [...(input.addonIds ?? [])].sort().join(",");
			const matchingItem = existingCart.items.find((item) => {
				if (item.menuItemId !== input.menuItemId) {
					return false;
				}
				if ((item.variantId ?? null) !== (input.variantId ?? null)) {
					return false;
				}
				const existingInstructions = (item.specialInstructions ?? "").trim();
				const targetInstructions = (input.specialInstructions ?? "").trim();
				if (existingInstructions !== targetInstructions) {
					return false;
				}
				const existingAddonSignature = item.addons
					.map((a) => a.addonId)
					.sort()
					.join(",");
				return existingAddonSignature === targetAddonSignature;
			});

			const addonsTotal = (input.itemAddons ?? []).reduce(
				(sum, a) => sum + Number(a.price || 0),
				0,
			);
			const unitPrice = Number(input.unitPrice || 0);

			if (matchingItem) {
				const newQuantity = matchingItem.quantity + input.quantity;
				const matchingAddonsTotal = matchingItem.addons.reduce(
					(sum, a) => sum + Number(a.price || 0),
					0,
				);
				const newTotal =
					(Number(matchingItem.unitPrice) + matchingAddonsTotal) * newQuantity;

				await tx.cartItem.update({
					where: { id: matchingItem.id },
					data: {
						quantity: newQuantity,
						totalPrice: newTotal,
					},
				});
			} else {
				const lineTotal = (unitPrice + addonsTotal) * input.quantity;
				const createdItem = await tx.cartItem.create({
					data: {
						cartId: input.cartId,
						menuItemId: input.menuItemId,
						menuItemName: input.menuItemName,
						variantId: input.variantId ?? null,
						variantName: input.variantName ?? null,
						unitPrice,
						totalPrice: lineTotal,
						quantity: input.quantity,
						specialInstructions: input.specialInstructions ?? null,
					},
				});

				if (input.itemAddons && input.itemAddons.length > 0) {
					await tx.cartItemAddon.createMany({
						data: input.itemAddons.map((addon) => ({
							cartItemId: createdItem.id,
							addonId: addon.addonId,
							addonName: addon.name,
							price: addon.price,
						})),
					});
				}
			}

			const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const reloadedRecord = await tx.cart.update({
				where: { id: input.cartId },
				data: {
					expiresAt: newExpiresAt,
				},
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			const isExpired = Date.now() > reloadedRecord.expiresAt.getTime();
			const status = isExpired ? CartStatus.EXPIRED : CartStatus.ACTIVE;

			const items = reloadedRecord.items.map(
				(item) =>
					new CartItem({
						id: item.id,
						cartId: item.cartId,
						menuItemId: item.menuItemId,
						menuItemName: item.menuItemName,
						variantId: item.variantId,
						variantName: item.variantName,
						quantity: item.quantity,
						unitPrice: Number(item.unitPrice),
						totalPrice: Number(item.totalPrice),
						specialInstructions: item.specialInstructions,
						addons: item.addons.map(
							(addon) =>
								new CartItemAddon({
									id: addon.id,
									cartItemId: addon.cartItemId,
									addonId: addon.addonId,
									addonName: addon.addonName,
									price: Number(addon.price),
								}),
						),
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					}),
			);

			return new Cart({
				id: reloadedRecord.id,
				restaurantId: reloadedRecord.restaurantId,
				userId: reloadedRecord.userId,
				status,
				expiresAt: reloadedRecord.expiresAt,
				items,
				createdAt: reloadedRecord.createdAt,
				updatedAt: reloadedRecord.updatedAt,
			});
		});

		return cart;
	}

	public async updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingCart = await tx.cart.findUnique({
				where: { id: cartId },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			if (!existingCart) {
				throw new Error("Cart not found in repository");
			}

			const existingItem = existingCart.items.find(
				(item) => item.id === cartItemId,
			);
			if (!existingItem) {
				throw new Error("Cart item not found in repository");
			}

			if (quantity === 0) {
				await tx.cartItemAddon.deleteMany({
					where: { cartItemId },
				});
				await tx.cartItem.delete({
					where: { id: cartItemId },
				});
			} else {
				const addonsTotal = existingItem.addons.reduce(
					(sum, a) => sum + Number(a.price || 0),
					0,
				);
				const newTotalPrice =
					(Number(existingItem.unitPrice) + addonsTotal) * quantity;

				await tx.cartItem.update({
					where: { id: cartItemId },
					data: {
						quantity,
						totalPrice: newTotalPrice,
					},
				});
			}

			const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const reloadedRecord = await tx.cart.update({
				where: { id: cartId },
				data: {
					expiresAt: newExpiresAt,
				},
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			const isExpired = Date.now() > reloadedRecord.expiresAt.getTime();
			const status = isExpired ? CartStatus.EXPIRED : CartStatus.ACTIVE;

			const items = reloadedRecord.items.map(
				(item) =>
					new CartItem({
						id: item.id,
						cartId: item.cartId,
						menuItemId: item.menuItemId,
						menuItemName: item.menuItemName,
						variantId: item.variantId,
						variantName: item.variantName,
						quantity: item.quantity,
						unitPrice: Number(item.unitPrice),
						totalPrice: Number(item.totalPrice),
						specialInstructions: item.specialInstructions,
						addons: item.addons.map(
							(addon) =>
								new CartItemAddon({
									id: addon.id,
									cartItemId: addon.cartItemId,
									addonId: addon.addonId,
									addonName: addon.addonName,
									price: Number(addon.price),
								}),
						),
						createdAt: item.createdAt,
						updatedAt: item.updatedAt,
					}),
			);

			return new Cart({
				id: reloadedRecord.id,
				restaurantId: reloadedRecord.restaurantId,
				userId: reloadedRecord.userId,
				status,
				expiresAt: reloadedRecord.expiresAt,
				items,
				createdAt: reloadedRecord.createdAt,
				updatedAt: reloadedRecord.updatedAt,
			});
		});

		return cart;
	}

	public async removeItem(cartId: string, cartItemId: string): Promise<Cart> {
		return this.updateItemQuantity(cartId, cartItemId, 0);
	}

	public async clearCart(cartId: string): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingCart = await tx.cart.findUnique({
				where: { id: cartId },
				include: {
					items: {
						select: { id: true },
					},
				},
			});

			if (!existingCart) {
				throw new Error("Cart not found in repository");
			}

			const itemIds = existingCart.items.map((item) => item.id);
			if (itemIds.length > 0) {
				await tx.cartItemAddon.deleteMany({
					where: { cartItemId: { in: itemIds } },
				});
				await tx.cartItem.deleteMany({
					where: { cartId },
				});
			}

			const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
			const reloadedRecord = await tx.cart.update({
				where: { id: cartId },
				data: {
					expiresAt: newExpiresAt,
				},
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			const isExpired = Date.now() > reloadedRecord.expiresAt.getTime();
			const status = isExpired ? CartStatus.EXPIRED : CartStatus.ACTIVE;

			return new Cart({
				id: reloadedRecord.id,
				restaurantId: reloadedRecord.restaurantId,
				userId: reloadedRecord.userId,
				status,
				expiresAt: reloadedRecord.expiresAt,
				items: [],
				createdAt: reloadedRecord.createdAt,
				updatedAt: reloadedRecord.updatedAt,
			});
		});

		return cart;
	}
}

export default PrismaCartRepository;
