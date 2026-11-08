import { TYPES } from "@config/di/types.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import type { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
import { RestaurantPlan } from "@domain/enums/restaurant-plan.enum.ts";
import {
	DomainError,
	OrderNotFoundError,
	OrderStatusConflictError,
} from "@domain/errors/index.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	GetRestaurantOrdersRepoParams,
	GetRestaurantOrdersRepoResult,
	GetStaffOrdersRepoParams,
	GetStaffOrdersRepoResult,
	StaffOrderListItemData,
} from "@domain/types/order-repository.types";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import {
	OrderPersistenceMapper,
	type PrismaOrderWithRelations,
} from "@infrastructure/database/mappers/order.mapper.ts";
import { PrismaBaseRepository } from "@infrastructure/database/repositories/prisma-base.repository.ts";
import {
	ORDER_DEFAULTS,
	ORDER_MESSAGES,
} from "@shared/constants/message.constants.ts";
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
						idempotencyKey: order.idempotencyKey,
						restaurantId: order.restaurantId,
						restaurantName: order.restaurantName,
						restaurantPlan: order.restaurantPlan,
						userId: order.userId,
						userName: order.userName,
						userPhone: order.userPhone,
						tableNumber: order.tableNumber,
						queueEntryId: order.queueEntryId,
						paymentId: order.paymentId,
						orderingMode: order.orderingMode,
						paymentMode: order.paymentMode,
						paymentStatus: order.paymentStatus,
						orderStatus: order.orderStatus,
						subtotal: order.subtotal,
						taxAmount: order.taxAmount,
						platformFee: order.platformFee,
						discountAmount: order.discountAmount,
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

	public async findByIdempotencyKey(key: string): Promise<Order | null> {
		try {
			const record = await this.prisma.order.findUnique({
				where: { idempotencyKey: key },
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
			this.handlePrismaError(error, { idempotencyKey: key });
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

		const totalOrders = await this.prisma.order.count({
			where: baseDateFilter,
		});

		const revenueAggregate = await this.prisma.order.aggregate({
			where: {
				...baseDateFilter,
				orderStatus: OrderStatus.COMPLETED,
			},
			_sum: {
				grandTotal: true,
			},
		});

		const statusGroups = await this.prisma.order.groupBy({
			by: ["orderStatus"],
			where: baseDateFilter,
			_count: {
				id: true,
			},
		});

		const statusCountMap: Record<string, number> = {};
		for (const group of statusGroups) {
			statusCountMap[group.orderStatus] = group._count.id;
		}

		const completedOrders = statusCountMap[OrderStatus.COMPLETED] ?? 0;
		const cancelledOrders = statusCountMap[OrderStatus.CANCELLED] ?? 0;

		const grossRevenue = revenueAggregate._sum.grandTotal
			? Number(revenueAggregate._sum.grandTotal.toFixed(2))
			: 0;

		return {
			summary: {
				totalOrders,
				grossRevenue,
				completedOrders,
				cancelledOrders,
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

	public async updatePaymentReference(
		orderId: string,
		paymentId: string,
	): Promise<void> {
		try {
			await this.prisma.order.update({
				where: { id: orderId },
				data: { paymentId },
			});
		} catch (error) {
			this.handlePrismaError(error, { orderId });
			throw error;
		}
	}

	public async getRestaurantOrders(
		params: GetRestaurantOrdersRepoParams,
	): Promise<GetRestaurantOrdersRepoResult> {
		try {
			const where: Prisma.OrderWhereInput = {
				restaurantId: params.restaurantId,
				...(params.search && {
					orderNumber: {
						contains: params.search,
						mode: "insensitive",
					},
				}),

				...(params.status && {
					orderStatus: params.status,
				}),

				...(params.fromDate || params.toDate
					? {
							createdAt: {
								...(params.fromDate && { gte: params.fromDate }),
								...(params.toDate && { lte: params.toDate }),
							},
						}
					: {}),
			};

			const skip = (params.page - 1) * params.limit;

			const [orderRecords, totalOrders] = await this.prisma.$transaction([
				this.prisma.order.findMany({
					where,
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
					where,
				}),
			]);

			const totalPages = Math.ceil(totalOrders / params.limit);

			return {
				orders: OrderPersistenceMapper.toRestaurantOrderItemList(orderRecords),
				totalOrders,
				totalPages,
				currentPage: params.page,
				hasNext: params.page < totalPages,
			};
		} catch (error) {
			this.handlePrismaError(error, params);
			throw error;
		}
	}

	public async getStaffOrders(
		params: GetStaffOrdersRepoParams,
	): Promise<GetStaffOrdersRepoResult> {
		try {
			const defaultStatuses = [
				OrderStatus.PLACED,
				OrderStatus.CONFIRMED,
				OrderStatus.PREPARING,
				OrderStatus.READY,
				OrderStatus.COMPLETED,
			];

			const statusFilter =
				params.status && params.status.length > 0
					? { in: params.status }
					: { in: defaultStatuses };

			const planFilter = params.orderType
				? params.orderType
				: { in: [RestaurantPlan.QUEUE_PRO, RestaurantPlan.SELF_PRO] };

			const sortDirection = params.sortOrder ?? "asc";

			const where: Prisma.OrderWhereInput = {
				restaurantId: params.restaurantId,
				orderStatus: statusFilter,
				restaurantPlan: planFilter,
				...(params.search && {
					orderNumber: {
						contains: params.search,
						mode: "insensitive",
					},
				}),
			};

			const skip = (params.page - 1) * params.limit;

			const [orderRecords, totalOrders] = await this.prisma.$transaction([
				this.prisma.order.findMany({
					where,
					skip,
					take: params.limit,
					orderBy: [{ createdAt: sortDirection }, { id: sortDirection }],
					include: {
						items: {
							include: {
								addons: true,
							},
						},
					},
				}),
				this.prisma.order.count({
					where,
				}),
			]);

			const totalPages = Math.ceil(totalOrders / params.limit) || 0;

			const orders: StaffOrderListItemData[] = orderRecords.map((record) => ({
				id: record.id,
				orderNumber: record.orderNumber,
				orderType: record.restaurantPlan as RestaurantPlan,
				status: record.orderStatus as OrderStatus,
				createdAt: record.createdAt,
				queueEntryId: record.queueEntryId,
				items: record.items.map((item) => ({
					menuItemId: item.menuItemId,
					name: item.itemName,
					quantity: item.quantity,
					variantId: item.variantId,
					variantName: item.variantName,
					addons: item.addons.map((addon) => ({
						id: addon.addonId,
						name: addon.addonName,
					})),
				})),
			}));

			return {
				orders,
				totalOrders,
				totalPages,
				currentPage: params.page,
				limit: params.limit,
				hasNext: params.page < totalPages,
			};
		} catch (error) {
			this.handlePrismaError(error, params);
			throw error;
		}
	}

	public async updatePaymentAndOrderStatus(
		orderId: string,
		paymentStatus: PaymentStatus,
		orderStatus?: OrderStatus,
		reason?: string,
		paymentId?: string,
	): Promise<void> {
		try {
			await this.prisma.$transaction(async (tx) => {
				const updateData: Prisma.OrderUpdateInput = {
					paymentStatus,
				};
				if (orderStatus) {
					updateData.orderStatus = orderStatus;
				}
				if (reason && orderStatus === OrderStatus.CANCELLED) {
					updateData.cancellationReason = reason;
					updateData.cancelledAt = new Date();
				}
				if (paymentId) {
					updateData.paymentId = paymentId;
				}

				await tx.order.update({
					where: { id: orderId },
					data: updateData,
				});

				if (orderStatus) {
					await tx.orderStatusHistory.create({
						data: {
							orderId,
							previousStatus: null,
							currentStatus: orderStatus,
							changedBy: "SYSTEM",
							notes: reason ?? `Status updated to ${orderStatus}`,
						},
					});
				}
			});
		} catch (error) {
			this.handlePrismaError(error, { orderId });
			throw error;
		}
	}

	public async findByRestaurantAndOrderId(
		restaurantId: string,
		orderId: string,
	): Promise<Order | null> {
		const order = await this.prisma.order.findFirst({
			where: {
				id: orderId,
				restaurantId: restaurantId,
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

		if (!order) {
			return null;
		}

		return order ? OrderPersistenceMapper.toDomain(order) : null;
	}
	public async updateOrderStatus(
		order: Order,
		previousStatus: OrderStatus,
		actorId: string,
		notes?: string | null,
	): Promise<Order> {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const updateResult = await tx.order.updateMany({
					where: {
						id: order.id,
						orderStatus: previousStatus,
					},
					data: {
						orderStatus: order.orderStatus,
						cancellationReason: order.cancellationReason,
						cancelledAt: order.cancelledAt,
						updatedAt: new Date(),
					},
				});

				if (updateResult.count === 0) {
					throw new OrderStatusConflictError(
						ORDER_MESSAGES.ORDER_STATUS_CONFLICT,
					);
				}

				const defaultNote =
					order.orderStatus === OrderStatus.COMPLETED
						? ORDER_DEFAULTS.COMPLETED_AUDIT_NOTE
						: ORDER_DEFAULTS.STATUS_UPDATED_AUDIT_NOTE(
								previousStatus,
								order.orderStatus,
							);

				await tx.orderStatusHistory.create({
					data: {
						orderId: order.id,
						previousStatus,
						currentStatus: order.orderStatus,
						changedBy: actorId,
						notes: notes || defaultNote,
						createdAt: new Date(),
					},
				});

				const updatedRecord = await tx.order.findUnique({
					where: { id: order.id },
					include: {
						items: {
							include: {
								addons: true,
							},
						},
						statusHistory: {
							orderBy: {
								createdAt: "desc",
							},
						},
					},
				});

				if (!updatedRecord) {
					throw new OrderNotFoundError(ORDER_MESSAGES.ORDER_NOT_FOUND);
				}

				return OrderPersistenceMapper.toDomain(updatedRecord);
			});
		} catch (error) {
			if (error instanceof DomainError) {
				throw error;
			}
			this.handlePrismaError(error, { orderId: order.id });
			throw error;
		}
	}
}
