import { TYPES } from "@config/di/types.ts";
import type {
	GetOrdersOverviewRepoParams,
	GetOrdersOverviewRepoResult,
	IOrderRepository,
} from "@domain/repositories/order.repository.interface.ts";
import type { Prisma, PrismaClient } from "@generated/prisma/client.ts";
import { OrderStatus } from "@generated/prisma/enums.ts";
import { OrderPersistenceMapper } from "@infrastructure/database/mappers/order.mapper.ts";
import { PrismaBaseRepository } from "@infrastructure/repositories/prisma-base.repository.ts";
import { inject, injectable } from "inversify";

@injectable()
export class PrismaOrderRepository
	extends PrismaBaseRepository
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
}
