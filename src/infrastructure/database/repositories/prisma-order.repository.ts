import { TYPES } from "@config/di/types.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import { OrderStatus } from "@domain/enums/order-status.enum.ts";
import { PaymentStatus } from "@domain/enums/payment-status.enum.ts";
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
	GetRestaurantOrderAnalyticsRepoParams,
	GetRestaurantOrdersRepoParams,
	GetRestaurantOrdersRepoResult,
	GetRestaurantProductAnalyticsRepoParams,
	GetStaffOrdersRepoParams,
	GetStaffOrdersRepoResult,
	RestaurantOrderAnalyticsRepoResult,
	RestaurantProductAnalyticsRepoResult,
} from "@domain/types/order-repository.types";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import {
	OrderPersistenceMapper,
	type PrismaOrderWithRelations,
} from "@infrastructure/database/mappers/order.mapper.ts";
import { PrismaBaseRepository } from "@infrastructure/database/repositories/prisma-base.repository.ts";
import {
	ANALYTICS_CONSTANTS,
	PRODUCT_CLASSIFICATIONS,
	type ProductClassification,
} from "@shared/constants/analytics.constants.ts";
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

			return {
				orders: OrderPersistenceMapper.toStaffOrderItemList(orderRecords),
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

	public async getRestaurantOrderAnalytics(
		params: GetRestaurantOrderAnalyticsRepoParams,
	): Promise<RestaurantOrderAnalyticsRepoResult> {
		const { restaurantId, startDate, nextPeriodStart, prevStartDate } = params;

		// 1. Current Settled Revenue (COMPLETED & PAID)
		const currentRevenueAgg = await this.prisma.order.aggregate({
			where: {
				restaurantId,
				createdAt: { gte: startDate, lt: nextPeriodStart },
				orderStatus: OrderStatus.COMPLETED,
				paymentStatus: PaymentStatus.PAID,
			},
			_sum: {
				subtotal: true,
				discountAmount: true,
				taxAmount: true,
				grandTotal: true,
			},
		});

		const grossSalesRupees = currentRevenueAgg._sum.subtotal
			? Number(currentRevenueAgg._sum.subtotal.toFixed(2))
			: 0;
		const discountRupees = currentRevenueAgg._sum.discountAmount
			? Number(currentRevenueAgg._sum.discountAmount.toFixed(2))
			: 0;
		const netSalesRupees = Number(
			(grossSalesRupees - discountRupees).toFixed(2),
		);
		const taxCollectedRupees = currentRevenueAgg._sum.taxAmount
			? Number(currentRevenueAgg._sum.taxAmount.toFixed(2))
			: 0;
		const totalBillAmountRupees = currentRevenueAgg._sum.grandTotal
			? Number(currentRevenueAgg._sum.grandTotal.toFixed(2))
			: 0;

		// 2. Previous Period Revenue for Growth %
		const prevRevenueAgg = await this.prisma.order.aggregate({
			where: {
				restaurantId,
				createdAt: { gte: prevStartDate, lt: startDate },
				orderStatus: OrderStatus.COMPLETED,
				paymentStatus: PaymentStatus.PAID,
			},
			_sum: {
				grandTotal: true,
			},
		});

		const prevSales = prevRevenueAgg._sum.grandTotal
			? Number(prevRevenueAgg._sum.grandTotal.toFixed(2))
			: 0;
		const revenueGrowth =
			prevSales === 0
				? totalBillAmountRupees > 0
					? 100
					: 0
				: Number(
						(((totalBillAmountRupees - prevSales) / prevSales) * 100).toFixed(
							1,
						),
					);

		// 3. Current Order Counts (100% of orders created in window)
		const totalOrderCount = await this.prisma.order.count({
			where: {
				restaurantId,
				createdAt: { gte: startDate, lt: nextPeriodStart },
			},
		});

		// Previous Order Count for Order Growth %
		const prevOrderCount = await this.prisma.order.count({
			where: {
				restaurantId,
				createdAt: { gte: prevStartDate, lt: startDate },
			},
		});

		const orderGrowth =
			prevOrderCount === 0
				? totalOrderCount > 0
					? 100
					: 0
				: Number(
						(
							((totalOrderCount - prevOrderCount) / prevOrderCount) *
							100
						).toFixed(1),
					);

		// 4. Dine-In vs Takeaway Counts
		// Orders with tableNumber are DINE_IN; orders without tableNumber are TAKEAWAY
		const dineInCount = await this.prisma.order.count({
			where: {
				restaurantId,
				createdAt: { gte: startDate, lt: nextPeriodStart },
				tableNumber: { not: null },
			},
		});
		const takeawayCount = totalOrderCount - dineInCount;

		// 5. Operations: Diners count is not tracked in Spotq (no guest count field); returned as 0 per SCRUM-1275 AC 7
		const dinersServedCount = 0;

		// Unique Customers (Database-level COUNT DISTINCT user_id)
		const customerCountResult = await this.prisma.$queryRaw<
			Array<{ count: bigint | number }>
		>`
			SELECT COUNT(DISTINCT user_id)::int as count 
			FROM orders 
			WHERE restaurant_id = ${restaurantId}::uuid
				AND created_at >= ${startDate}
				AND created_at < ${nextPeriodStart}
				AND user_id IS NOT NULL
		`;
		const uniqueCustomersCount = Number(customerCountResult[0]?.count ?? 0);

		// 6. Order Status Breakdown (100% of orders created in window)
		const statusGroups = await this.prisma.order.groupBy({
			by: ["orderStatus"],
			where: {
				restaurantId,
				createdAt: { gte: startDate, lt: nextPeriodStart },
			},
			_count: {
				id: true,
			},
			_sum: {
				grandTotal: true,
			},
		});

		const distribution = statusGroups.map((group) => {
			const count = group._count.id;
			const percentage =
				totalOrderCount === 0
					? 0
					: Number(((count / totalOrderCount) * 100).toFixed(2));
			const amountRupees = group._sum.grandTotal
				? Number(group._sum.grandTotal.toFixed(2))
				: 0;

			return {
				status: group.orderStatus,
				count,
				percentage,
				amountRupees,
			};
		});

		return {
			overview: {
				revenue: {
					grossSalesRupees,
					discountRupees,
					netSalesRupees,
					taxCollectedRupees,
					totalBillAmountRupees,
					growthPercentage: revenueGrowth,
				},
				orders: {
					totalOrderCount,
					growthPercentage: orderGrowth,
					dineInCount,
					takeawayCount,
				},
				operations: {
					dinersServedCount,
					uniqueCustomersCount,
				},
			},
			orderStatusBreakdown: {
				totalOrdersTracked: totalOrderCount,
				distribution,
			},
		};
	}

	public async getRestaurantProductAnalytics(
		params: GetRestaurantProductAnalyticsRepoParams,
	): Promise<RestaurantProductAnalyticsRepoResult> {
		const { restaurantId, startDate, nextPeriodStart, page, limit } = params;

		// 1. Group order items for completed orders in window with DB-level ordering
		const itemAggregates = await this.prisma.orderItem.groupBy({
			by: ["menuItemId", "itemName"],
			where: {
				order: {
					restaurantId,
					createdAt: { gte: startDate, lt: nextPeriodStart },
					orderStatus: OrderStatus.COMPLETED,
					paymentStatus: PaymentStatus.PAID,
				},
			},
			_sum: {
				quantity: true,
				totalPrice: true,
			},
			orderBy: {
				_sum: {
					quantity: "desc",
				},
			},
		});

		// Total sales across all products for percentageOfTotalSales
		const totalPeriodSales = itemAggregates.reduce(
			(acc, item) =>
				acc + (item._sum.totalPrice ? Number(item._sum.totalPrice) : 0),
			0,
		);

		const totalProductsSold = itemAggregates.length;

		// Map to ProductPerformanceItemData using constants
		const allItems = itemAggregates.map((item) => {
			const quantitySold = item._sum.quantity ?? 0;
			const grossSalesRupees = item._sum.totalPrice
				? Number(item._sum.totalPrice.toFixed(2))
				: 0;
			const percentageOfTotalSales =
				totalPeriodSales === 0
					? 0
					: Number(((grossSalesRupees / totalPeriodSales) * 100).toFixed(1));

			const classification: ProductClassification =
				quantitySold <= ANALYTICS_CONSTANTS.LOW_VOLUME_THRESHOLD
					? PRODUCT_CLASSIFICATIONS.LOW_VOLUME
					: PRODUCT_CLASSIFICATIONS.NORMAL;

			return {
				menuItemId: item.menuItemId,
				name: item.itemName,
				quantitySold,
				grossSalesRupees,
				percentageOfTotalSales,
				classification,
			};
		});

		// 2. Top Selling: Sorted primarily by quantitySold DESC, secondarily by grossSalesRupees DESC, tertiarily by name ASC
		const topSellingSorted = [...allItems].sort((a, b) => {
			if (b.quantitySold !== a.quantitySold) {
				return b.quantitySold - a.quantitySold;
			}
			if (b.grossSalesRupees !== a.grossSalesRupees) {
				return b.grossSalesRupees - a.grossSalesRupees;
			}
			return a.name.localeCompare(b.name);
		});

		// 3. Slow Moving: Filtered items with quantity <= LOW_VOLUME_THRESHOLD, sorted primarily by quantitySold ASC, secondarily by grossSalesRupees ASC, tertiarily by name ASC
		const slowMovingItems = allItems.filter(
			(item) => item.classification === PRODUCT_CLASSIFICATIONS.LOW_VOLUME,
		);
		const slowMovingSorted = [...slowMovingItems].sort((a, b) => {
			if (a.quantitySold !== b.quantitySold) {
				return a.quantitySold - b.quantitySold;
			}
			if (a.grossSalesRupees !== b.grossSalesRupees) {
				return a.grossSalesRupees - b.grossSalesRupees;
			}
			return a.name.localeCompare(b.name);
		});

		// 4. Pagination Helper with safe boundary checks
		const totalTopItems = topSellingSorted.length;
		const totalTopPages = Math.max(1, Math.ceil(totalTopItems / limit));
		const topStartIndex = (page - 1) * limit;
		const topPagedItems =
			topStartIndex < totalTopItems
				? topSellingSorted.slice(topStartIndex, topStartIndex + limit)
				: [];

		const totalSlowItems = slowMovingSorted.length;
		const totalSlowPages = Math.max(1, Math.ceil(totalSlowItems / limit));
		const slowStartIndex = (page - 1) * limit;
		const slowPagedItems =
			slowStartIndex < totalSlowItems
				? slowMovingSorted.slice(slowStartIndex, slowStartIndex + limit)
				: [];

		return {
			totalProductsSold,
			topSelling: {
				items: topPagedItems,
				pagination: {
					totalItems: totalTopItems,
					totalPages: totalTopPages,
					currentPage: totalTopItems === 0 ? 1 : page,
					limit,
					hasNextPage: page < totalTopPages,
					hasPrevPage: page > 1 && page <= totalTopPages,
				},
			},
			slowMoving: {
				items: slowPagedItems,
				pagination: {
					totalItems: totalSlowItems,
					totalPages: totalSlowPages,
					currentPage: totalSlowItems === 0 ? 1 : page,
					limit,
					hasNextPage: page < totalSlowPages,
					hasPrevPage: page > 1 && page <= totalSlowPages,
				},
			},
		};
	}
}
