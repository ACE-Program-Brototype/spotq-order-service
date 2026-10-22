import { ORDER_DEFAULTS } from "@common/constants/message.constants.ts";
import { TYPES } from "@config/di/types.ts";
import type { Order } from "@domain/entities/order.entity.ts";
import type { IOrderRepository } from "@domain/repositories/order.repository.interface.ts";
import type {
	CancelledOrderData,
	GetCustomerOrderHistoryRepoParams,
	GetCustomerOrderHistoryRepoResult,
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
} from "@domain/types/order-repository.types";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import { OrderStatus } from "@generated/prisma/enums.ts";
import { OrderPersistenceMapper } from "@infrastructure/database/mappers/order.mapper.ts";
import { PrismaBaseRepository } from "@infrastructure/repositories/prisma-base.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class PrismaOrderRepository
	extends PrismaBaseRepository<Order>
	implements IOrderRepository
{
	constructor(
		@inject(TYPES.PrismaClient)
		private readonly prisma: PrismaClient,
	) {
		super();
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

	public async cancelOrder(
		order: Order,
		previousStatus: OrderStatus,
	): Promise<CancelledOrderData> {
		try {
			return await this.prisma.$transaction(async (tx) => {
				const updated = await tx.order.update({
					where: {
						id: order.id,
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
						notes: order.cancellationReason ?? ORDER_DEFAULTS.CANCEL_AUDIT_NOTE,
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
