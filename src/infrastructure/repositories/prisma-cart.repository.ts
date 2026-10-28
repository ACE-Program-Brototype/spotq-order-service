import { CART_LIMITS } from "@common/constants/limits.constants.ts";
import { TYPES } from "@config/di/types.ts";
import { Cart } from "@domain/entities/cart.entity.ts";
import { CartItem } from "@domain/entities/cart-item.entity.ts";
import { CartItemAddon } from "@domain/entities/cart-item-addon.entity.ts";
import { CartStatus } from "@domain/enums/cart-status.enum.ts";
import { InvalidCartQuantityError } from "@domain/errors/invalid-cart-quantity.error.ts";
import type {
	AddItemInput,
	ICartRepository,
	ReplaceCartBatchInput,
	UpdateCartInput,
} from "@domain/repositories/cart.repository.interface.ts";
import type { PrismaClient } from "@generated/prisma/client.ts";
import { inject, injectable } from "inversify";
import {
	type IEntityMapper,
	PrismaBaseRepository,
} from "./prisma-base.repository.ts";

type PrismaCartRecord = {
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

const cartMapper: IEntityMapper<Cart, PrismaCartRecord> = {
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

@injectable()
export class PrismaCartRepository
	extends PrismaBaseRepository<Cart, PrismaCartRecord>
	implements ICartRepository
{
	constructor(
		@inject(TYPES.PrismaClient)
		private readonly prisma: PrismaClient,
	) {
		super(prisma.cart, cartMapper);
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

		return cartMapper.toDomain(record as unknown as PrismaCartRecord);
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

	public async findActiveByUserId(
		userId: string,
		restaurantId?: string,
	): Promise<Cart | null> {
		const record = await this.prisma.cart.findFirst({
			where: {
				userId,
				...(restaurantId ? { restaurantId } : {}),
				expiresAt: {
					gt: new Date(),
				},
			},
			orderBy: {
				updatedAt: "desc",
			},
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

		return cartMapper.toDomain(record as unknown as PrismaCartRecord);
	}

	public async addItem(input: AddItemInput): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			let existingRecord = input.cartId
				? await tx.cart.findUnique({
						where: { id: input.cartId },
						include: {
							items: {
								include: {
									addons: true,
								},
							},
						},
					})
				: null;

			if (!existingRecord && input.userId && input.restaurantId) {
				const existingByPair = await tx.cart.findUnique({
					where: {
						userId_restaurantId: {
							userId: input.userId,
							restaurantId: input.restaurantId,
						},
					},
					include: {
						items: {
							select: { id: true },
						},
					},
				});

				const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

				if (existingByPair) {
					const isExpired = existingByPair.expiresAt < new Date();

					if (isExpired) {
						const staleItemIds = existingByPair.items.map((it) => it.id);
						if (staleItemIds.length > 0) {
							await tx.cartItemAddon.deleteMany({
								where: { cartItemId: { in: staleItemIds } },
							});
							await tx.cartItem.deleteMany({
								where: { cartId: existingByPair.id },
							});
						}
					}

					existingRecord = await tx.cart.update({
						where: { id: existingByPair.id },
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
				} else {
					existingRecord = await tx.cart.create({
						data: {
							...(input.cartId ? { id: input.cartId } : {}),
							userId: input.userId,
							restaurantId: input.restaurantId,
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
				}
			} else if (
				existingRecord &&
				existingRecord.items.length === 0 &&
				input.restaurantId &&
				existingRecord.restaurantId !== input.restaurantId
			) {
				await tx.cart.delete({ where: { id: existingRecord.id } });
				const newExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
				existingRecord = await tx.cart.upsert({
					where: {
						userId_restaurantId: {
							userId: input.userId ?? existingRecord.userId,
							restaurantId: input.restaurantId,
						},
					},
					create: {
						...(input.cartId ? { id: input.cartId } : {}),
						userId: input.userId ?? existingRecord.userId,
						restaurantId: input.restaurantId,
						expiresAt: newExpiresAt,
					},
					update: {
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
			}

			if (!existingRecord) {
				throw new Error("Cart not found in repository");
			}

			const targetCartId = existingRecord.id;
			const existingCart = cartMapper.toDomain(
				existingRecord as unknown as PrismaCartRecord,
			);
			const matchingItem = existingCart.findMatchingItem(
				input.menuItemId,
				input.variantId,
				input.addonIds,
				input.specialInstructions,
			);

			if (matchingItem) {
				const newQuantity = matchingItem.quantity + input.quantity;
				if (newQuantity > 20) {
					throw new InvalidCartQuantityError();
				}
				const updatedItem = new CartItem({
					...matchingItem,
					quantity: newQuantity,
				});
				const newTotal = updatedItem.calculateLineTotal();

				await tx.cartItem.update({
					where: { id: matchingItem.id },
					data: {
						quantity: newQuantity,
						totalPrice: newTotal,
					},
				});
			} else {
				const newItemEntity = new CartItem({
					id: "temp",
					cartId: targetCartId,
					menuItemId: input.menuItemId,
					menuItemName: input.menuItemName,
					variantId: input.variantId ?? null,
					variantName: input.variantName ?? null,
					quantity: input.quantity,
					unitPrice: input.unitPrice,
					specialInstructions: input.specialInstructions ?? null,
					addons: (input.itemAddons ?? []).map((addon) => ({
						id: "temp",
						cartItemId: "temp",
						addonId: addon.addonId,
						addonName: addon.name,
						price: addon.price,
					})),
				});
				const lineTotal = newItemEntity.calculateLineTotal();

				const createdItem = await tx.cartItem.create({
					data: {
						cartId: targetCartId,
						menuItemId: input.menuItemId,
						menuItemName: input.menuItemName,
						variantId: input.variantId ?? null,
						variantName: input.variantName ?? null,
						unitPrice: input.unitPrice,
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
				where: { id: targetCartId },
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

			return cartMapper.toDomain(reloadedRecord as unknown as PrismaCartRecord);
		});

		return cart;
	}

	public async replaceCartItemsBatch(
		input: ReplaceCartBatchInput,
	): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingUserCarts = await tx.cart.findMany({
				where: { userId: input.userId },
				include: {
					items: {
						select: { id: true },
					},
				},
			});

			const allExistingItemIds = existingUserCarts.flatMap((existingCart) =>
				existingCart.items.map((item) => item.id),
			);

			if (allExistingItemIds.length > 0) {
				await tx.cartItemAddon.deleteMany({
					where: { cartItemId: { in: allExistingItemIds } },
				});
				await tx.cartItem.deleteMany({
					where: { id: { in: allExistingItemIds } },
				});
			}

			const otherRestaurantCartIds = existingUserCarts
				.filter(
					(existingCart) => existingCart.restaurantId !== input.restaurantId,
				)
				.map((existingCart) => existingCart.id);

			if (otherRestaurantCartIds.length > 0) {
				await tx.cart.deleteMany({
					where: { id: { in: otherRestaurantCartIds } },
				});
			}

			const newExpiresAt = new Date(
				Date.now() + CART_LIMITS.EXPIRATION_WINDOW_MS,
			);

			const targetCart = await tx.cart.upsert({
				where: {
					userId_restaurantId: {
						userId: input.userId,
						restaurantId: input.restaurantId,
					},
				},
				create: {
					userId: input.userId,
					restaurantId: input.restaurantId,
					expiresAt: newExpiresAt,
				},
				update: {
					expiresAt: newExpiresAt,
				},
			});

			for (const item of input.items) {
				const createdItem = await tx.cartItem.create({
					data: {
						cartId: targetCart.id,
						menuItemId: item.menuItemId,
						menuItemName: item.menuItemName,
						variantId: item.variantId,
						variantName: item.variantName,
						unitPrice: item.unitPrice,
						totalPrice: item.totalPrice,
						quantity: item.quantity,
						specialInstructions: item.specialInstructions,
					},
				});

				if (item.itemAddons.length > 0) {
					await tx.cartItemAddon.createMany({
						data: item.itemAddons.map((addon) => ({
							cartItemId: createdItem.id,
							addonId: addon.addonId,
							addonName: addon.name,
							price: addon.price,
						})),
					});
				}
			}

			const reloadedRecord = await tx.cart.findUnique({
				where: { id: targetCart.id },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			if (!reloadedRecord) {
				throw new Error("Cart not found in repository");
			}

			return cartMapper.toDomain(reloadedRecord as unknown as PrismaCartRecord);
		});

		return cart;
	}

	public async updateItemQuantity(
		cartId: string,
		cartItemId: string,
		quantity: number,
	): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingRecord = await tx.cart.findUnique({
				where: { id: cartId },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});

			if (!existingRecord) {
				throw new Error("Cart not found in repository");
			}

			const existingCart = cartMapper.toDomain(
				existingRecord as unknown as PrismaCartRecord,
			);
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
				const updatedItem = new CartItem({
					...existingItem,
					quantity,
				});
				const newTotalPrice = updatedItem.calculateLineTotal();

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

			return cartMapper.toDomain(reloadedRecord as unknown as PrismaCartRecord);
		});

		return cart;
	}

	public async removeItem(cartId: string, cartItemId: string): Promise<Cart> {
		return this.updateItemQuantity(cartId, cartItemId, 0);
	}

	public async clearCart(cartId: string): Promise<Cart> {
		const cart = await this.prisma.$transaction(async (tx) => {
			const existingRecord = await tx.cart.findUnique({
				where: { id: cartId },
				include: {
					items: {
						select: { id: true },
					},
				},
			});

			if (!existingRecord) {
				throw new Error("Cart not found in repository");
			}

			const itemIds = existingRecord.items.map((item) => item.id);
			if (itemIds.length > 0) {
				await tx.cartItemAddon.deleteMany({
					where: { cartItemId: { in: itemIds } },
				});
				await tx.cartItem.deleteMany({
					where: { cartId },
				});

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
				return cartMapper.toDomain(
					reloadedRecord as unknown as PrismaCartRecord,
				);
			}

			// Cart is already empty: idempotent no-op without unnecessary expiresAt rewrite
			const emptyCartRecord = await tx.cart.findUnique({
				where: { id: cartId },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
				},
			});
			return cartMapper.toDomain(
				emptyCartRecord as unknown as PrismaCartRecord,
			);
		});

		return cart;
	}
}
