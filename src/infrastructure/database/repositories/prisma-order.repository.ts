import { TYPES } from "@config/di/types.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
} from "@domain/types/order-repository.types";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import {
	OrderPersistenceMapper,
	type PrismaOrderWithRelations,
} from "@infrastructure/database/mappers/order.mapper.ts";
import { PrismaBaseRepository } from "@infrastructure/database/repositories/prisma-base.repository.ts";
import { ORDER_DEFAULTS } from "@shared/constants/message.constants.ts";
import { inject, injectable } from "inversify";

@injectable()
export class PrismaOrderRepository
	extends PrismaBaseRepository<Order, PrismaOrderWithRelations>
	implements IOrderRepository
{
	constructor(
		@inject(TYPES.PrismaClient)
		private readonly prisma: PrismaClient,
	) {
		super(prisma.order, OrderPersistenceMapper);
	}

	public async create(order: Order, cartIdToClear?: string): Promise<Order> {
		try {
			const createdRecord = await this.prisma.$transaction(async (tx) => {
				const record = await tx.order.create({
					data: {
						id: order.id,
						orderNumber: order.orderNumber,
						restaurantId: order.restaurantId,
						restaurantName: order.restaurantName,
						userId: order.userId,
						userName: order.userName,
						userPhone: order.userPhone,
						tableId: order.tableId,
						tableNumber: order.tableNumber,
						queueEntryId: order.queueEntryId,
						paymentId: order.paymentId,
						priority: order.priority,
						orderType: order.orderType,
						paymentMode: order.paymentMode,
						paymentStatus: order.paymentStatus,
						orderStatus: order.orderStatus,
						subtotal: order.subtotal,
						taxAmount: order.taxAmount,
						platformFee: order.platformFee,
						discountAmount: order.discountAmount,
						couponCode: order.couponCode,
						grandTotal: order.grandTotal,
						estimatedReadyAt: order.estimatedReadyAt,
						specialInstructions: order.specialInstructions,
						createdAt: order.createdAt,
						updatedAt: order.updatedAt,
						items: {
							create: order.items.map((item) => ({
								id: item.id,
								menuItemId: item.menuItemId,
								itemName: item.itemName,
								variantId: item.variantId,
								variantName: item.variantName,
								quantity: item.quantity,
								unitPrice: item.unitPrice,
								totalPrice: item.totalPrice,
								specialInstructions: item.specialInstructions,
								createdAt: item.createdAt,
								addons: {
									create: item.addons.map((addon) => ({
										id: addon.id,
										addonId: addon.addonId,
										addonName: addon.addonName,
										price: addon.price,
									})),
								},
							})),
						},
						statusHistory: {
							create: order.statusHistory.map((history) => ({
								id: history.id,
								previousStatus: history.previousStatus,
								currentStatus: history.currentStatus,
								changedBy: history.changedBy,
								notes: history.notes,
								createdAt: history.createdAt,
							})),
						},
					},
					include: {
						items: {
							include: {
								addons: true,
							},
						},
						statusHistory: true,
					},
				});

				if (cartIdToClear) {
					const existingCart = await tx.cart.findUnique({
						where: { id: cartIdToClear },
						include: {
							items: {
								select: { id: true },
							},
						},
					});

					if (existingCart && existingCart.items.length > 0) {
						const itemIds = existingCart.items.map((item) => item.id);
						await tx.cartItemAddon.deleteMany({
							where: { cartItemId: { in: itemIds } },
						});
						await tx.cartItem.deleteMany({
							where: { cartId: cartIdToClear },
						});
					}
				}

				return record;
			});

			return OrderPersistenceMapper.toDomain(createdRecord);
		} catch (error) {
			this.handlePrismaError(error, order);
			throw error;
		}
	}

	public override async findById(orderId: string): Promise<Order | null> {
		try {
			const record = await this.prisma.order.findUnique({
				where: { id: orderId },
				include: {
					items: {
						include: {
							addons: true,
						},
					},
					statusHistory: true,
				},
			});

			return record ? OrderPersistenceMapper.toDomain(record) : null;
		} catch (error) {
			this.handlePrismaError(error, orderId);
			throw error;
		}
	}

	public async findActiveByUserId(
		restaurantId: string,
		userId: string,
	): Promise<Order | null> {
		try {
			const record = await this.prisma.order.findFirst({
				where: {
					restaurantId,
					userId,
					orderStatus: {
						notIn: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
					},
				},
				include: {
					items: {
						include: {
							addons: true,
						},
					},
					statusHistory: true,
				},
				orderBy: {
					createdAt: "desc",
				},
			});

			return record ? OrderPersistenceMapper.toDomain(record) : null;
		} catch (error) {
			this.handlePrismaError(error, { restaurantId, userId });
			throw error;
		}
	}

	public async getOrdersOverview(
		params: GetOrdersOverviewRepoParams,
	): Promise<GetOrdersOverviewRepoResult> {
		const baseDateFilter: Prisma.OrderWhereInput = {
			restaurantId: params.restaurantId,
		};

		if (params.fromDate || params.toDate) {
			baseDateFilter.createdAt = {
				...(params.fromDate && { gte: params.fromDate }),
				...(params.toDate && { lte: params.toDate }),
			};
		}

		const listFilter: Prisma.OrderWhereInput = {
			...baseDateFilter,
			...(params.status && { orderStatus: params.status }),
		};

		if (params.search) {
			listFilter.OR = [
				{ orderNumber: { contains: params.search, mode: "insensitive" } },
				{ userName: { contains: params.search, mode: "insensitive" } },
				{ userPhone: { contains: params.search, mode: "insensitive" } },
			];
		}

		const skip = (params.page - 1) * params.limit;

		const [
			totalOrders,
			revenueAggregate,
			statusGroups,
			ordersRecords,
			totalFilteredItems,
		] = await Promise.all([
			this.prisma.order.count({
				where: baseDateFilter,
			}),

			this.prisma.order.aggregate({
				where: {
					...baseDateFilter,
					orderStatus: OrderStatus.COMPLETED,
				},
				_sum: {
					grandTotal: true,
				},
			}),

			this.prisma.order.groupBy({
				by: ["orderStatus"],
				where: baseDateFilter,
				_count: {
					id: true,
				},
			}),

			this.prisma.order.findMany({
				where: listFilter,
				skip,
				take: params.limit,
				orderBy: {
					createdAt: "desc",
				},
				include: {
					_count: {
						select: {
							items: true,
						},
					},
				},
			}),

			this.prisma.order.count({
				where: listFilter,
			}),
		]);

		const statusCountMap: Record<string, number> = {};
		for (const group of statusGroups) {
			statusCountMap[group.orderStatus] = group._count.id;
		}

		const completedOrders = statusCountMap[OrderStatus.COMPLETED] ?? 0;
		const cancelledOrders = statusCountMap[OrderStatus.CANCELLED] ?? 0;
		const pendingOrders =
			(statusCountMap[OrderStatus.PLACED] ?? 0) +
			(statusCountMap[OrderStatus.CONFIRMED] ?? 0);
		const preparingOrders = statusCountMap[OrderStatus.PREPARING] ?? 0;
		const readyOrders = statusCountMap[OrderStatus.READY] ?? 0;

		const grossRevenue = revenueAggregate._sum.grandTotal
			? Number(revenueAggregate._sum.grandTotal.toFixed(2))
			: 0;

		const orders = OrderPersistenceMapper.toOverviewItemList(ordersRecords);

		const totalPages = Math.ceil(totalFilteredItems / params.limit) || 1;

		return {
			summary: {
				totalOrders,
				grossRevenue,
				completedOrders,
				cancelledOrders,
				pendingOrders,
				preparingOrders,
				readyOrders,
			},
			orders,
			pagination: {
				currentPage: params.page,
				totalPages,
				totalItems: totalFilteredItems,
			},
		};
	}

	public async getCustomerOrderHistory(
		params: GetCustomerOrderHistoryRepoParams,
	): Promise<GetCustomerOrderHistoryRepoResult> {
		const where: Prisma.OrderWhereInput = {
			userId: params.customerId,
			...(params.status && { orderStatus: params.status }),
		};

		const skip = (params.page - 1) * params.limit;

		const [ordersRecords, totalOrders] = await Promise.all([
			this.prisma.order.findMany({
				where,
				skip,
				take: params.limit,
				orderBy: {
					createdAt: "desc",
				},
				select: {
					id: true,
					orderNumber: true,
					restaurantId: true,
					orderStatus: true,
					grandTotal: true,
					createdAt: true,
					_count: {
						select: {
							items: true,
						},
					},
				},
			}),
			this.prisma.order.count({
				where,
			}),
		]);

		const totalPages = Math.ceil(totalOrders / params.limit) || 0;
		const hasNext = params.page < totalPages;

		const orders =
			OrderPersistenceMapper.toCustomerOrderItemList(ordersRecords);

		return {
			orders,
			totalOrders,
			totalPages,
			currentPage: params.page,
			hasNext,
		};
	}

	public async cancelOrder(
		order: Order,
		previousStatus: OrderStatus,
	): Promise<CancelledOrderData> {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const updated = await tx.order.update({
					where: {
						id: order.id,
						orderStatus: {
							in: [OrderStatus.PLACED, OrderStatus.CONFIRMED],
						},
					},
					data: {
						orderStatus: order.orderStatus,
						cancellationReason: order.cancellationReason,
						cancelledAt: order.cancelledAt,
					},
					select: {
						id: true,
						orderNumber: true,
						orderStatus: true,
						cancellationReason: true,
						cancelledAt: true,
					},
				});

				await tx.orderStatusHistory.create({
					data: {
						orderId: order.id,
						previousStatus,
						currentStatus: order.orderStatus,
						changedBy: order.userId ?? ORDER_DEFAULTS.CHANGED_BY_CUSTOMER,
						notes:
							order.cancellationReason?.trim() ||
							ORDER_DEFAULTS.CANCEL_AUDIT_NOTE,
					},
				});

				return OrderPersistenceMapper.toCancelledOrder(updated);
			});
		} catch (error) {
			this.handlePrismaError(error, { orderId: order.id });
			throw error;
		}
	}
}
