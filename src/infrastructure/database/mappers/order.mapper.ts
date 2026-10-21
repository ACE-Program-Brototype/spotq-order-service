import type {
	CustomerOrderHistoryItemData,
	OrderOverviewItemData,
} from "@domain/repositories/order.repository.interface.ts";
import type { Prisma } from "@generated/prisma/client.ts";

export interface PrismaOrderOverviewRecord {
	id: string;
	orderNumber: string;
	orderStatus: string;
	userId: string | null;
	grandTotal: Prisma.Decimal;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export interface PrismaCustomerOrderRecord {
	id: string;
	orderNumber: string;
	restaurantId: string;
	orderStatus: string;
	grandTotal: Prisma.Decimal;
	_count: {
		items: number;
	};
	createdAt: Date;
}

export const OrderPersistenceMapper = {
	toOverviewItem(record: PrismaOrderOverviewRecord): OrderOverviewItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			orderStatus: record.orderStatus,
			userId: record.userId,
			grandTotal: Number(record.grandTotal.toFixed(2)),
			itemsCount: record._count.items,
			createdAt: record.createdAt,
		};
	},

	toOverviewItemList(
		records: PrismaOrderOverviewRecord[],
	): OrderOverviewItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toOverviewItem(record),
		);
	},

	toCustomerOrderItem(
		record: PrismaCustomerOrderRecord,
	): CustomerOrderHistoryItemData {
		return {
			orderId: record.id,
			orderNumber: record.orderNumber,
			restaurantId: record.restaurantId,
			orderStatus: record.orderStatus,
			grandTotal: Number(record.grandTotal.toFixed(2)),
			itemsCount: record._count.items,
			createdAt: record.createdAt,
		};
	},

	toCustomerOrderItemList(
		records: PrismaCustomerOrderRecord[],
	): CustomerOrderHistoryItemData[] {
		return records.map((record) =>
			OrderPersistenceMapper.toCustomerOrderItem(record),
		);
	},
};
