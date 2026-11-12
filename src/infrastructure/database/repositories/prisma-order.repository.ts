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
	GetAdminOrdersRepoParams,
	GetAdminOrdersRepoResult,
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
	ProductPerformanceItemData,
	RestaurantOrderAnalyticsRepoResult,
	RestaurantProductAnalyticsRepoResult,
} from "@domain/types/order-repository.types";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import {
	OrderPersistenceMapper,
	type PrismaAdminOrderRecord,
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

	public async getAdminOrders(
		params: GetAdminOrdersRepoParams,
	): Promise<GetAdminOrdersRepoResult> {
		try {
			const search = params.search?.trim();
			const where: Prisma.OrderWhereInput = {
				...(params.status?.length
					? { orderStatus: { in: params.status } }
					: {}),
				...(params.restaurantId ? { restaurantId: params.restaurantId } : {}),
				...(params.customerId ? { userId: params.customerId } : {}),
				...(params.paymentStatus
					? { paymentStatus: params.paymentStatus as PaymentStatus }
					: {}),
				...(params.startDate || params.endDate
					? {
							createdAt: {
								...(params.startDate ? { gte: params.startDate } : {}),
								...(params.endDate ? { lt: params.endDate } : {}),
							},
						}
					: {}),
				...(params.minAmount !== undefined || params.maxAmount !== undefined
					? {
							grandTotal: {
								...(params.minAmount !== undefined
									? { gte: params.minAmount }
									: {}),
								...(params.maxAmount !== undefined
									? { lte: params.maxAmount }
									: {}),
							},
						}
					: {}),
				...(search
					? {
							OR: [
								{ id: search },
								{ orderNumber: { contains: search, mode: "insensitive" } },
								{ restaurantId: search },
								{ userId: search },
							],
						}
					: {}),
			};

			const sortFields = {
				createdAt: "createdAt",
				updatedAt: "updatedAt",
				totalAmount: "grandTotal",
				status: "orderStatus",
			} as const;
			const sortField = sortFields[params.sortBy ?? "createdAt"];
			const sortOrder = params.sortOrder ?? "desc";
			const skip = (params.page - 1) * params.limit;

			const [records, totalOrders, statusGroups, totals, metricsTotalOrders] =
				await this.prisma.$transaction([
					this.prisma.order.findMany({
						where,
						skip,
						take: params.limit,
						orderBy: [{ [sortField]: sortOrder }, { id: "asc" }],
						select: {
							id: true,
							orderNumber: true,
							restaurantId: true,
							restaurantName: true,
							userId: true,
							orderStatus: true,
							paymentStatus: true,
							paymentId: true,
							subtotal: true,
							taxAmount: true,
							grandTotal: true,
							platformFee: true,
							createdAt: true,
							updatedAt: true,
						},
					}),
					this.prisma.order.count({ where }),
					this.prisma.order.groupBy({
						by: ["orderStatus"],
						_count: { _all: true },
					}),
					this.prisma.order.aggregate({
						_sum: { grandTotal: true },
					}),
					this.prisma.order.count(),
				]);

			const totalPages = Math.ceil(totalOrders / params.limit);

			const ordersByStatus = statusGroups.reduce<
				Partial<Record<OrderStatus, number>>
			>((result, group) => {
				result[group.orderStatus] = group._count._all;
				return result;
			}, {});
			const adminOrders = OrderPersistenceMapper.toAdminOrderItemList(
				records as PrismaAdminOrderRecord[],
			);

			return {
				orders: adminOrders,
				totalOrders,
				totalPages,
				currentPage: params.page,
				limit: params.limit,
				hasNextPage: params.page < totalPages,
				hasPreviousPage: params.page > 1,
				ordersByStatus,
				metricsTotalOrders,
				totalOrderValue: Number((totals._sum.grandTotal ?? 0).toString()),
			};
		} catch (error) {
			this.handlePrismaError(error, params);
			throw error;
		}
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
		auditNote?: string,
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
						paymentStatus: order.paymentStatus,
						cancellationReason: order.cancellationReason,
						cancelledAt: order.cancelledAt,
					},
					select: {
						id: true,
						orderNumber: true,
						orderStatus: true,
						paymentStatus: true,
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
							auditNote ??
							(order.cancellationReason?.trim() ||
								ORDER_DEFAULTS.CANCEL_AUDIT_NOTE),
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

	public async findByCustomerAndOrderId(
		customerId: string,
		orderId: string,
	): Promise<Order | null> {
		try {
			const order = await this.prisma.order.findFirst({
				where: {
					id: orderId,
					userId: customerId,
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

			return OrderPersistenceMapper.toDomain(order);
		} catch (error) {
			this.handlePrismaError(error, { customerId, orderId });
			throw error;
		}
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

		// 1. Current and Previous Period Aggregations + Order Status Breakdown executed in parallel
		const [currentAggResult, prevAggResult, statusGroups] = await Promise.all([
			// Consolidated aggregation: Gross, Discount, Tax, Total Bill, Order Counts, Dine-In, and Unique Customers in 1 query
			this.prisma.$queryRaw<
				Array<{
					gross_sales: string | number;
					discount_amount: string | number;
					tax_amount: string | number;
					total_bill_amount: string | number;
					total_order_count: number;
					dine_in_count: number;
					unique_customers_count: number;
				}>
			>`
				SELECT
					COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' AND payment_status = 'PAID' THEN subtotal ELSE 0 END), 0)::numeric AS gross_sales,
					COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' AND payment_status = 'PAID' THEN discount_amount ELSE 0 END), 0)::numeric AS discount_amount,
					COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' AND payment_status = 'PAID' THEN tax_amount ELSE 0 END), 0)::numeric AS tax_amount,
					COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' AND payment_status = 'PAID' THEN grand_total ELSE 0 END), 0)::numeric AS total_bill_amount,
					COUNT(*)::int AS total_order_count,
					COUNT(CASE WHEN table_number IS NOT NULL THEN 1 END)::int AS dine_in_count,
					COUNT(DISTINCT user_id)::int AS unique_customers_count
				FROM orders
				WHERE restaurant_id = ${restaurantId}::uuid
					AND created_at >= ${startDate}
					AND created_at < ${nextPeriodStart}
			`,

			// Consolidated previous period aggregation: Previous Revenue & Previous Order Count in 1 query
			this.prisma.$queryRaw<
				Array<{
					prev_sales: string | number;
					prev_order_count: number;
				}>
			>`
				SELECT
					COALESCE(SUM(CASE WHEN order_status = 'COMPLETED' AND payment_status = 'PAID' THEN grand_total ELSE 0 END), 0)::numeric AS prev_sales,
					COUNT(*)::int AS prev_order_count
				FROM orders
				WHERE restaurant_id = ${restaurantId}::uuid
					AND created_at >= ${prevStartDate}
					AND created_at < ${startDate}
			`,

			// Order status breakdown
			this.prisma.order.groupBy({
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
			}),
		]);

		const current = currentAggResult[0];
		const grossSalesRupees = Number(
			Number(current?.gross_sales ?? 0).toFixed(2),
		);
		const discountRupees = Number(
			Number(current?.discount_amount ?? 0).toFixed(2),
		);
		const netSalesRupees = Number(
			(grossSalesRupees - discountRupees).toFixed(2),
		);
		const taxCollectedRupees = Number(
			Number(current?.tax_amount ?? 0).toFixed(2),
		);
		const totalBillAmountRupees = Number(
			Number(current?.total_bill_amount ?? 0).toFixed(2),
		);
		const totalOrderCount = Number(current?.total_order_count ?? 0);
		const dineInCount = Number(current?.dine_in_count ?? 0);
		const takeawayCount = Math.max(0, totalOrderCount - dineInCount);
		const uniqueCustomersCount = Number(current?.unique_customers_count ?? 0);

		const prev = prevAggResult[0];
		const prevSales = Number(Number(prev?.prev_sales ?? 0).toFixed(2));
		const prevOrderCount = Number(prev?.prev_order_count ?? 0);

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

		/**
		 * Operations: Diners count is not tracked in Spotq (no guest count field);
		 * returned as 0 per SCRUM-1275 AC 7.
		 */
		const dinersServedCount = 0;

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
		const offset = (page - 1) * limit;

		// Execute Totals, Top Selling, and Slow Moving queries in parallel using database-level sorting, grouping & pagination
		const [totalsResult, topSellingRows, slowMovingRows] = await Promise.all([
			// 1. Overall Totals across the period
			this.prisma.$queryRaw<
				Array<{
					total_products_sold: number;
					total_period_sales: string | number;
				}>
			>`
				SELECT
					COUNT(DISTINCT oi.menu_item_id)::int AS total_products_sold,
					COALESCE(SUM(oi.total_price), 0)::numeric AS total_period_sales
				FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE o.restaurant_id = ${restaurantId}::uuid
					AND o.created_at >= ${startDate}
					AND o.created_at < ${nextPeriodStart}
					AND o.order_status = 'COMPLETED'
					AND o.payment_status = 'PAID'
			`,

			// 2. Top Selling: Sorted in DB primarily by quantitySold DESC, secondarily by grossSalesRupees DESC, tertiarily by itemName ASC
			this.prisma.$queryRaw<
				Array<{
					menu_item_id: string;
					item_name: string;
					quantity_sold: number;
					gross_sales_rupees: string | number;
					full_count: number;
				}>
			>`
				SELECT
					oi.menu_item_id,
					oi.item_name,
					SUM(oi.quantity)::int AS quantity_sold,
					COALESCE(SUM(oi.total_price), 0)::numeric AS gross_sales_rupees,
					COUNT(*) OVER()::int AS full_count
				FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE o.restaurant_id = ${restaurantId}::uuid
					AND o.created_at >= ${startDate}
					AND o.created_at < ${nextPeriodStart}
					AND o.order_status = 'COMPLETED'
					AND o.payment_status = 'PAID'
				GROUP BY oi.menu_item_id, oi.item_name
				ORDER BY quantity_sold DESC, gross_sales_rupees DESC, oi.item_name ASC
				LIMIT ${limit} OFFSET ${offset}
			`,

			// 3. Slow Moving: Filtered in DB with quantity <= LOW_VOLUME_THRESHOLD, sorted primarily by quantitySold ASC, secondarily by grossSalesRupees ASC, tertiarily by itemName ASC
			this.prisma.$queryRaw<
				Array<{
					menu_item_id: string;
					item_name: string;
					quantity_sold: number;
					gross_sales_rupees: string | number;
					full_count: number;
				}>
			>`
				SELECT
					oi.menu_item_id,
					oi.item_name,
					SUM(oi.quantity)::int AS quantity_sold,
					COALESCE(SUM(oi.total_price), 0)::numeric AS gross_sales_rupees,
					COUNT(*) OVER()::int AS full_count
				FROM order_items oi
				JOIN orders o ON oi.order_id = o.id
				WHERE o.restaurant_id = ${restaurantId}::uuid
					AND o.created_at >= ${startDate}
					AND o.created_at < ${nextPeriodStart}
					AND o.order_status = 'COMPLETED'
					AND o.payment_status = 'PAID'
				GROUP BY oi.menu_item_id, oi.item_name
				HAVING SUM(oi.quantity) <= ${ANALYTICS_CONSTANTS.LOW_VOLUME_THRESHOLD}
				ORDER BY quantity_sold ASC, gross_sales_rupees ASC, oi.item_name ASC
				LIMIT ${limit} OFFSET ${offset}
			`,
		]);

		const totalPeriodSales = Number(
			Number(totalsResult[0]?.total_period_sales ?? 0).toFixed(2),
		);
		const totalProductsSold = Number(totalsResult[0]?.total_products_sold ?? 0);

		const mapProductRow = (row: {
			menu_item_id: string;
			item_name: string;
			quantity_sold: number;
			gross_sales_rupees: string | number;
		}): ProductPerformanceItemData => {
			const quantitySold = Number(row.quantity_sold ?? 0);
			const grossSalesRupees = Number(
				Number(row.gross_sales_rupees ?? 0).toFixed(2),
			);
			const percentageOfTotalSales =
				totalPeriodSales === 0
					? 0
					: Number(((grossSalesRupees / totalPeriodSales) * 100).toFixed(1));

			const classification: ProductClassification =
				quantitySold <= ANALYTICS_CONSTANTS.LOW_VOLUME_THRESHOLD
					? PRODUCT_CLASSIFICATIONS.LOW_VOLUME
					: PRODUCT_CLASSIFICATIONS.NORMAL;

			return {
				menuItemId: row.menu_item_id,
				name: row.item_name,
				quantitySold,
				grossSalesRupees,
				percentageOfTotalSales,
				classification,
			};
		};

		const totalTopItems = Number(topSellingRows[0]?.full_count ?? 0);
		const totalTopPages = Math.max(1, Math.ceil(totalTopItems / limit));
		const topItems = topSellingRows.map(mapProductRow);

		const totalSlowItems = Number(slowMovingRows[0]?.full_count ?? 0);
		const totalSlowPages = Math.max(1, Math.ceil(totalSlowItems / limit));
		const slowItems = slowMovingRows.map(mapProductRow);

		return {
			totalProductsSold,
			topSelling: {
				items: topItems,
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
				items: slowItems,
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
